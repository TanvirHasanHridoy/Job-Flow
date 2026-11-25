/**
 * Bridged-claim detection and hard-line enforcement (v2 Phase 2).
 *
 * After generation, every piece of CV / cover-letter text is compared with the
 * candidate's own profile. Anything the profile does not back up is a "bridged
 * claim" that the user must review (keep or remove):
 *   - new-skill    a technology the profile never mentions
 *   - moved-skill  a technology the profile has, but not at this job/project
 *   - number       a figure that does not appear anywhere in the profile
 * Hard-line violations are removed automatically (server side):
 *   - gap-skill    a GAP requirement claimed in the CV
 *   - credential   a degree / certification / licence the profile does not have
 *
 * Pure and isomorphic: used by /api/tailor and by the Tailor page (which re-runs
 * detection after manual edits or AI section regeneration).
 */

import type { Requirement } from './requirements';

export type BridgedTermKind = 'new-skill' | 'moved-skill' | 'number' | 'gap-skill' | 'credential';

export interface BridgedTerm {
  term: string;          // text as it appears in the claim
  kind: BridgedTermKind;
  source?: string;       // e.g. "bridged from Angular", "used at Datavista AG"
}

export type ClaimSection = 'summary' | 'experience' | 'skills' | 'projects' | 'coverLetter';

export interface BridgedClaim {
  key: string;
  section: ClaimSection;
  text: string;                 // the full unit (bullet / sentence block / skill)
  terms: BridgedTerm[];
  jobIndex?: number;            // experience
  variant?: 'star' | 'punchy' | 'standard';
  itemIndex?: number;           // bullet / skill / summary-bullet / paragraph index
  projectIndex?: number;        // projects
  field?: 'summary' | 'summaryBullet' | 'description' | 'technologies' | 'paragraph';
  paragraphSet?: 'short' | 'detailed';
  isViolation: boolean;         // contains gap-skill or credential terms
}

/* ------------------------------------------------------------------ */
/* Text helpers                                                        */
/* ------------------------------------------------------------------ */

const stripHtml = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');

function collectStrings(value: unknown, out: string[], skipKeys = new Set(['photo', 'signature', 'id'])): void {
  if (typeof value === 'string') { out.push(value); return; }
  if (Array.isArray(value)) { value.forEach(v => collectStrings(v, out, skipKeys)); return; }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (skipKeys.has(k)) continue;
      collectStrings(v, out, skipKeys);
    }
  }
}

function parseMaybeJson(v: unknown): unknown {
  if (typeof v === 'string') {
    const t = v.trim();
    if (t.startsWith('[') || t.startsWith('{')) {
      try { return JSON.parse(t); } catch { return v; }
    }
  }
  return v;
}

function textOf(value: unknown): string {
  const out: string[] = [];
  collectStrings(parseMaybeJson(value), out);
  return stripHtml(out.join(' \n '));
}

export function splitSentences(text: string): string[] {
  return text.match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g)?.map(s => s.trim()).filter(Boolean) || [text];
}

/* ------------------------------------------------------------------ */
/* Term matching                                                       */
/* ------------------------------------------------------------------ */

// Frameworks commonly written with or without a ".js" suffix.
const JS_SUFFIX_BASES = new Set(['react', 'vue', 'angular', 'node', 'nest', 'nuxt', 'svelte', 'ember', 'backbone', 'd3', 'three', 'next', 'express', 'chart', 'solid']);
// Plain English words that are also tech names: only match them in their tech form.
const AMBIGUOUS_WORDS = new Set(['next', 'express', 'chart', 'three', 'solid', 'go', 'spring', 'swift', 'rust', 'ruby', 'rails', 'flask', 'chef', 'puppet', 'jest', 'mocha', 'ember', 'backbone', 'gatsby', 'remix', 'kafka', 'r', 'c', 'agile', 'scrum', 'rest', 'git']);

/** Common technologies, so invented ones are caught even if the job ad never named them. */
const TECH_TERMS = [
  'JavaScript', 'TypeScript', 'React', 'React Native', 'Angular', 'Vue', 'Svelte', 'Next.js', 'Nuxt', 'Redux', 'RxJS', 'jQuery',
  'Tailwind CSS', 'Material UI', 'Bootstrap', 'GraphQL', 'Apollo', 'WebSockets', 'Node.js', 'NestJS', 'Express.js', 'Deno', 'Bun',
  'Python', 'Django', 'FastAPI', 'Pydantic', 'Java', 'Spring Boot', 'Kotlin', 'Scala', 'C#', '.NET', 'ASP.NET', 'C++', 'Golang',
  'PHP', 'Laravel', 'Symfony', 'Ruby on Rails', 'Elixir', 'PostgreSQL', 'MySQL', 'MariaDB', 'SQLite', 'MongoDB', 'Redis',
  'DynamoDB', 'Cassandra', 'Elasticsearch', 'Firebase', 'Firestore', 'Supabase', 'Prisma', 'TypeORM', 'Sequelize', 'Hibernate',
  'AWS', 'Lambda', 'ECS', 'EKS', 'S3', 'Azure', 'GCP', 'Google Cloud', 'Docker', 'Kubernetes', 'Helm', 'Terraform', 'Ansible',
  'Jenkins', 'GitHub Actions', 'GitLab CI', 'CircleCI', 'Kafka', 'RabbitMQ', 'SQS', 'Microservices', 'Serverless',
  'Jest', 'Vitest', 'Cypress', 'Playwright', 'Selenium', 'JUnit', 'Mockito', 'Pytest', 'Testcontainers', 'React Testing Library',
  'Storybook', 'Webpack', 'Vite', 'Figma', 'Datadog', 'Grafana', 'Prometheus', 'Sentry', 'OAuth2', 'OpenID Connect', 'JWT',
  'LangChain', 'LlamaIndex', 'OpenAI', 'PyTorch', 'TensorFlow', 'Pandas', 'NumPy', 'Spark', 'Airflow', 'dbt', 'Snowflake',
  'Mapbox', 'Stripe', 'Salesforce', 'SAP', 'Linux', 'Bash', 'Swift', 'SwiftUI', 'Flutter', 'Dart', 'Android', 'iOS',
];

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const patternCache = new Map<string, RegExp | null>();

/** Case-insensitive pattern for a technology term with tolerant boundaries (C#, .NET, Node.js). */
export function termPattern(term: string): RegExp | null {
  const key = term.trim();
  if (patternCache.has(key)) return patternCache.get(key)!;

  let pattern: RegExp | null = null;
  if (key && !(key.length <= 2 && /^[a-z]+$/i.test(key))) {
    const suffixMatch = key.match(/^(.+?)(?:\.?js)$/i);
    let body: string;
    if (suffixMatch && JS_SUFFIX_BASES.has(suffixMatch[1].toLowerCase())) {
      const base = escapeRe(suffixMatch[1]).replace(/\s+/g, '\\s+');
      // "Next.js" must keep its suffix ("next" is an English word); "React.js" may drop it
      body = AMBIGUOUS_WORDS.has(suffixMatch[1].toLowerCase()) ? `${base}\\.?js` : `${base}(?:\\.?js)?`;
    } else if (JS_SUFFIX_BASES.has(key.toLowerCase()) && !AMBIGUOUS_WORDS.has(key.toLowerCase())) {
      body = `${escapeRe(key)}(?:\\.?js)?`;
    } else {
      body = escapeRe(key).replace(/\s+/g, '\\s+');
    }
    // Ambiguous English words must appear capitalised to count as the technology
    const flags = AMBIGUOUS_WORDS.has(key.toLowerCase()) ? '' : 'i';
    pattern = new RegExp(`(^|[^A-Za-z0-9+#])(${body})(?![A-Za-z0-9+#])`, flags);
  }
  patternCache.set(key, pattern);
  return pattern;
}

function findTerms(text: string, terms: string[]): Array<{ term: string; found: string; start: number; end: number }> {
  const hits: Array<{ term: string; found: string; start: number; end: number }> = [];
  for (const term of terms) {
    const re = termPattern(term);
    if (!re) continue;
    const m = re.exec(text);
    if (m) {
      const start = m.index + m[1].length;
      hits.push({ term, found: m[2], start, end: start + m[2].length });
    }
  }
  // Prefer longer matches ("Spring Boot" over "Spring", "React Native" over "React")
  hits.sort((a, b) => (b.end - b.start) - (a.end - a.start));
  const kept: typeof hits = [];
  for (const h of hits) {
    if (!kept.some(k => h.start >= k.start && h.end <= k.end)) kept.push(h);
  }
  return kept;
}

const mentions = (corpus: string, term: string) => !!termPattern(term)?.test(corpus);

/* ------------------------------------------------------------------ */
/* Numbers                                                             */
/* ------------------------------------------------------------------ */

const NUMBER_RE = /(?<![\w.,])(\d{1,3}(?:[.,]\d{3})+|\d+(?:[.,]\d+)?)(\s*(?:%|percent\b|prozent\b|k\b|m\b|mm\b|mio\.?|million(?:en)?\b|mrd\.?|billion\b|bn\b|x\b|fps\b|ms\b))?/gi;

interface NumberToken { raw: string; key: string }

export function extractNumbers(text: string): NumberToken[] {
  const out: NumberToken[] = [];
  for (const m of text.matchAll(NUMBER_RE)) {
    const digits = m[1];
    const unit = (m[2] || '').trim().toLowerCase();
    let value = /^\d{1,3}([.,]\d{3})+$/.test(digits) ? Number(digits.replace(/[.,]/g, '')) : Number(digits.replace(',', '.'));
    if (!Number.isFinite(value)) continue;
    const isPct = unit === '%' || unit.startsWith('percent') || unit.startsWith('prozent');
    if (unit === 'k') value *= 1e3;
    else if (unit === 'm' || unit === 'mm' || unit.startsWith('mio') || unit.startsWith('million')) value *= 1e6;
    else if (unit.startsWith('mrd') || unit === 'billion' || unit === 'bn') value *= 1e9;

    // Ignore years, dates and small counts ("3 junior developers", "6 years") unless it's a percentage
    if (!isPct && !unit && ((value >= 1950 && value <= 2100 && Number.isInteger(value)) || value <= 15)) continue;
    const key = `${isPct ? '%' : unit === 'x' ? 'x' : ''}${Math.round(value * 1000) / 1000}`;
    out.push({ raw: m[0].trim(), key });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Credentials                                                          */
/* ------------------------------------------------------------------ */

const CREDENTIAL_RE = /\b(ph\.?\s?d|doctorate|doktor\w*|master'?s(?:\s+degree)?|m\.?\s?sc\.?|msc|m\.?\s?eng|mba|bachelor'?s(?:\s+degree)?|b\.?\s?sc\.?|bsc|b\.?\s?eng|diplom\w*|certified|certification|certificate|zertifi\w*|licen[cs]ed?|lizenz\w*)(?![A-Za-z])/i;
const NEGATION_RE = /\b(not|no|don'?t|do not|haven'?t|have not|without|although|though|lack|lacking|instead of|working towards|pursuing|plan to|planning|eager to|kein\w*|nicht|ohne|obwohl|derzeit\s+in)\b/i;

function credentialKey(raw: string): string {
  const r = raw.toLowerCase().replace(/[\s.']/g, '');
  if (/^(phd|doctorate|doktor)/.test(r)) return 'phd';
  if (/^(master|msc|meng|mba)/.test(r)) return r.startsWith('mba') ? 'mba' : 'master';
  if (/^(bachelor|bsc|beng)/.test(r)) return 'bachelor';
  if (r.startsWith('diplom')) return 'diplom';
  return 'cert';
}

function credentialsInProfile(educationAndCerts: string): Set<string> {
  const keys = new Set<string>();
  const re = new RegExp(CREDENTIAL_RE.source, 'gi');
  for (const m of educationAndCerts.matchAll(re)) keys.add(credentialKey(m[1]));
  return keys;
}

/* ------------------------------------------------------------------ */
/* Context                                                             */
/* ------------------------------------------------------------------ */

interface DetectContext {
  requirements: Requirement[];
  profileCorpus: string;
  jobCorpora: Array<{ company: string; text: string }>;
  projectCorpora: Array<{ name: string; text: string }>;
  profileNumbers: Set<string>;
  profileCredentials: Set<string>;
  candidateTerms: string[];
  adjacentTerms: Map<string, string>;   // lowercased term -> bridgeFrom
  gapTerms: Set<string>;                // lowercased GAP terms
}

function asArray(v: unknown): any[] {
  const parsed = parseMaybeJson(v);
  return Array.isArray(parsed) ? parsed : [];
}

function buildContext(profile: any, requirements: Requirement[], tailoredCv: any): DetectContext {
  const work = asArray(profile?.workExperience);
  const projects = asArray(profile?.projects);
  const profileCorpus = textOf({ ...profile, personas: undefined });

  const jobCorpora = work.map((j: any) => ({ company: String(j?.company || ''), text: textOf(j) }));
  const projectCorpora = projects.map((p: any) => ({ name: String(p?.name || ''), text: textOf(p) }));

  const profileNumbers = new Set(extractNumbers(profileCorpus).map(n => n.key));
  const educationText = textOf([profile?.education, profile?.customSections]);
  const profileCredentials = credentialsInProfile(educationText);

  const adjacentTerms = new Map<string, string>();
  const gapTerms = new Set<string>();
  const reqTerms: string[] = [];
  for (const r of requirements || []) {
    if (r.category === 'education' || r.category === 'certification' || r.category === 'experience') continue;
    for (const t of r.terms || []) {
      reqTerms.push(t);
      if (r.status === 'ADJACENT') adjacentTerms.set(t.toLowerCase(), r.bridgeFrom || '');
      if (r.status === 'GAP') gapTerms.add(t.toLowerCase());
    }
  }

  const tailoredSkillNames = asArray(tailoredCv?.skills).map((s: any) => (typeof s === 'string' ? s : s?.name)).filter(Boolean);
  const projectTechs = asArray(tailoredCv?.projects).flatMap((p: any) => asArray(p?.technologies)).filter((t: any) => typeof t === 'string');

  const seen = new Set<string>();
  const candidateTerms: string[] = [];
  for (const t of [...reqTerms, ...tailoredSkillNames, ...projectTechs, ...TECH_TERMS]) {
    const term = String(t).trim();
    const k = term.toLowerCase();
    // Skip long phrases (sentence-like requirement terms make poor keywords)
    if (!term || seen.has(k) || term.split(/\s+/).length > 4) continue;
    seen.add(k);
    candidateTerms.push(term);
  }

  return { requirements, profileCorpus, jobCorpora, projectCorpora, profileNumbers, profileCredentials, candidateTerms, adjacentTerms, gapTerms };
}

/** Loose name equality: ignores case, punctuation and parenthetical suffixes. */
export function sameName(a: string, b: string): boolean {
  const norm = (x: string) => x.toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
  const na = norm(a), nb = norm(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const [first] = na.split(' ');
  const [firstB] = nb.split(' ');
  return (na.startsWith(nb + ' ') || nb.startsWith(na + ' ')) || (first.length >= 4 && first === firstB);
}

function companyIndex(ctx: DetectContext, company: string): number {
  const c = company.toLowerCase().trim();
  if (!c) return -1;
  return ctx.jobCorpora.findIndex(j => {
    const jc = j.company.toLowerCase().trim();
    return jc === c || (jc && (jc.includes(c) || c.includes(jc)));
  });
}

function whereInProfile(ctx: DetectContext, term: string): string {
  const job = ctx.jobCorpora.find(j => mentions(j.text, term));
  if (job) return `used at ${job.company}`;
  const proj = ctx.projectCorpora.find(p => mentions(p.text, term));
  if (proj) return `used in project ${proj.name}`;
  return 'listed in your skills';
}

/* ------------------------------------------------------------------ */
/* Detection                                                           */
/* ------------------------------------------------------------------ */

function analyseUnit(
  ctx: DetectContext,
  text: string,
  scope: { jobCorpus?: string; projectCorpus?: string; allowGapMentions?: boolean }
): BridgedTerm[] {
  const clean = stripHtml(text);
  const terms: BridgedTerm[] = [];

  for (const hit of findTerms(clean, ctx.candidateTerms)) {
    const lower = hit.term.toLowerCase();
    const inProfile = mentions(ctx.profileCorpus, hit.term);
    if (!inProfile) {
      if (ctx.gapTerms.has(lower)) {
        if (!scope.allowGapMentions) terms.push({ term: hit.found, kind: 'gap-skill', source: 'missing from your profile' });
      } else {
        const from = ctx.adjacentTerms.get(lower);
        terms.push({ term: hit.found, kind: 'new-skill', source: from ? `bridged from ${from}` : 'not in your profile' });
      }
      continue;
    }
    const localCorpus = scope.jobCorpus ?? scope.projectCorpus;
    if (localCorpus !== undefined && !mentions(localCorpus, hit.term)) {
      terms.push({ term: hit.found, kind: 'moved-skill', source: whereInProfile(ctx, hit.term) });
    }
  }

  for (const n of extractNumbers(clean)) {
    if (!ctx.profileNumbers.has(n.key)) terms.push({ term: n.raw, kind: 'number', source: 'figure not in your profile' });
  }

  for (const sentence of splitSentences(clean)) {
    const m = sentence.match(CREDENTIAL_RE);
    if (m && !NEGATION_RE.test(sentence) && !ctx.profileCredentials.has(credentialKey(m[1]))) {
      terms.push({ term: m[1], kind: 'credential', source: 'credential not in your profile' });
    }
  }
  return terms;
}

function hashKey(parts: string[]): string {
  const s = parts.join('|');
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}

/** Stable key for a claim: same text + same terms = same key (used for "accepted" state). */
export function claimKey(section: string, text: string): string {
  return `${section}:${hashKey([stripHtml(text).replace(/\s+/g, ' ').trim().toLowerCase()])}`;
}

const VIOLATIONS: BridgedTermKind[] = ['gap-skill', 'credential'];

export function detectBridgedClaims(input: {
  tailoredCv: any;
  coverLetter?: any;
  profile: any;
  requirements: Requirement[];
}): BridgedClaim[] {
  const { tailoredCv, coverLetter, profile, requirements } = input;
  if (!tailoredCv || !profile) return [];
  const ctx = buildContext(profile, requirements || [], tailoredCv);
  const claims: BridgedClaim[] = [];

  const push = (base: Omit<BridgedClaim, 'key' | 'isViolation' | 'terms'>, terms: BridgedTerm[]) => {
    if (terms.length === 0) return;
    claims.push({ ...base, terms, key: claimKey(base.section, base.text), isViolation: terms.some(t => VIOLATIONS.includes(t.kind)) });
  };

  // Summary (paragraph or capability bullets)
  if (Array.isArray(tailoredCv.summaryBullets) && tailoredCv.summaryBullets.length > 0) {
    tailoredCv.summaryBullets.forEach((b: string, i: number) =>
      push({ section: 'summary', text: b, field: 'summaryBullet', itemIndex: i }, analyseUnit(ctx, b, {})));
  } else if (typeof tailoredCv.summary === 'string' && tailoredCv.summary.trim()) {
    push({ section: 'summary', text: tailoredCv.summary, field: 'summary' }, analyseUnit(ctx, tailoredCv.summary, {}));
  }

  // Experience bullets, per style variant
  asArray(tailoredCv.workExperience).forEach((job: any, jobIndex: number) => {
    const idx = companyIndex(ctx, String(job?.company || ''));
    const jobCorpus = idx >= 0 ? ctx.jobCorpora[idx].text : '';
    const bullets = job?.bullets;
    const variants: Array<['star' | 'punchy' | 'standard', unknown]> = Array.isArray(bullets)
      ? [['star', bullets]]
      : [['star', bullets?.star], ['punchy', bullets?.punchy], ['standard', bullets?.standard]];
    for (const [variant, list] of variants) {
      asArray(list).forEach((b: unknown, itemIndex: number) => {
        if (typeof b !== 'string') return;
        push({ section: 'experience', text: b, jobIndex, variant, itemIndex }, analyseUnit(ctx, b, { jobCorpus }));
      });
    }
  });

  // Skills list (a skill may be a single name or a grouped string like "Python | Flask | FastAPI")
  asArray(tailoredCv.skills).forEach((s: any, itemIndex: number) => {
    const name = typeof s === 'string' ? s : s?.name;
    if (!name) return;
    const hits = findTerms(name, ctx.candidateTerms);
    const terms: BridgedTerm[] = [];
    for (const hit of hits) {
      if (mentions(ctx.profileCorpus, hit.term)) continue;
      const lower = hit.term.toLowerCase();
      if (ctx.gapTerms.has(lower)) {
        terms.push({ term: hit.found, kind: 'gap-skill', source: 'missing from your profile' });
      } else {
        const from = ctx.adjacentTerms.get(lower);
        terms.push({ term: hit.found, kind: 'new-skill', source: from ? `bridged from ${from}` : 'not in your profile' });
      }
    }
    if (hits.length === 0 && !mentions(ctx.profileCorpus, name) && !ctx.profileCorpus.toLowerCase().includes(String(name).toLowerCase())) {
      terms.push({ term: name, kind: 'new-skill', source: 'not in your profile' });
    }
    push({ section: 'skills', text: name, itemIndex }, terms);
  });

  // Projects
  asArray(tailoredCv.projects).forEach((p: any, projectIndex: number) => {
    const original = ctx.projectCorpora.find(pc => sameName(pc.name, String(p?.name || '')));
    const projectCorpus = original?.text ?? '';
    if (typeof p?.description === 'string' && p.description.trim()) {
      push({ section: 'projects', text: p.description, projectIndex, field: 'description' }, analyseUnit(ctx, p.description, { projectCorpus }));
    }
    const techs = asArray(p?.technologies).filter((t: unknown) => typeof t === 'string');
    techs.forEach((t: string, itemIndex: number) => {
      const terms = analyseUnit(ctx, t, { projectCorpus }).filter(x => x.kind !== 'number');
      push({ section: 'projects', text: t, projectIndex, field: 'technologies', itemIndex }, terms);
    });
  });

  // Cover letter: gaps may be mentioned honestly, so only new skills / numbers / credentials count
  const paragraphs = coverLetter?.paragraphs;
  const sets: Array<['short' | 'detailed', unknown]> = Array.isArray(paragraphs)
    ? [['short', paragraphs]]
    : [['short', paragraphs?.short], ['detailed', paragraphs?.detailed]];
  for (const [paragraphSet, list] of sets) {
    asArray(list).forEach((para: unknown, itemIndex: number) => {
      if (typeof para !== 'string') return;
      push({ section: 'coverLetter', text: para, field: 'paragraph', paragraphSet, itemIndex }, analyseUnit(ctx, para, { allowGapMentions: true }));
    });
  }

  return claims;
}

/* ------------------------------------------------------------------ */
/* Hard-line enforcement (server, right after generation)              */
/* ------------------------------------------------------------------ */

function removeViolatingSentences(text: string, violatingTerms: string[]): string {
  const lowered = violatingTerms.map(t => t.toLowerCase());
  return splitSentences(text)
    .filter(s => !lowered.some(t => s.toLowerCase().includes(t)))
    .join(' ')
    .trim();
}

/**
 * Removes hard-line violations from a generated result (mutates and returns it):
 * GAP skills claimed in the CV, credentials the profile doesn't have, and
 * certifications not in the profile. Returns what was removed for transparency.
 */
export function enforceHardLines(result: any, profile: any, requirements: Requirement[]): { removed: string[] } {
  const removed: string[] = [];
  const cv = result?.tailoredCv;
  if (!cv) return { removed };

  const claims = detectBridgedClaims({ tailoredCv: cv, coverLetter: result.tailoredCoverLetter, profile, requirements })
    .filter(c => c.isViolation);

  // Process from the end so indices stay valid while removing
  const ordered = [...claims].sort((a, b) => (b.itemIndex ?? 0) - (a.itemIndex ?? 0));
  for (const claim of ordered) {
    const bad = claim.terms.filter(t => VIOLATIONS.includes(t.kind)).map(t => t.term);
    switch (claim.section) {
      case 'summary':
        if (claim.field === 'summaryBullet' && Array.isArray(cv.summaryBullets)) {
          cv.summaryBullets.splice(claim.itemIndex!, 1);
        } else if (typeof cv.summary === 'string') {
          cv.summary = removeViolatingSentences(cv.summary, bad);
        }
        break;
      case 'experience': {
        const job = cv.workExperience?.[claim.jobIndex!];
        const list = Array.isArray(job?.bullets) ? job.bullets : job?.bullets?.[claim.variant!];
        if (Array.isArray(list)) list.splice(claim.itemIndex!, 1);
        break;
      }
      case 'skills': {
        if (!Array.isArray(cv.skills)) break;
        const entry = cv.skills[claim.itemIndex!];
        const name = typeof entry === 'string' ? entry : entry?.name;
        const parts = typeof name === 'string' ? name.split(/\s*[|,]\s*/) : [];
        const lowered = bad.map(t => t.toLowerCase());
        const kept = parts.filter(p => !lowered.some(t => p.toLowerCase().includes(t)));
        if (parts.length > 1 && kept.length > 0) {
          const joined = kept.join(name.includes('|') ? ' | ' : ', ');
          if (typeof entry === 'string') cv.skills[claim.itemIndex!] = joined; else entry.name = joined;
        } else {
          cv.skills.splice(claim.itemIndex!, 1);
        }
        break;
      }
      case 'projects': {
        const proj = cv.projects?.[claim.projectIndex!];
        if (!proj) break;
        if (claim.field === 'description') proj.description = removeViolatingSentences(proj.description, bad);
        else if (claim.field === 'technologies' && Array.isArray(proj.technologies)) proj.technologies.splice(claim.itemIndex!, 1);
        break;
      }
      case 'coverLetter': {
        const paras = result.tailoredCoverLetter?.paragraphs;
        const list = Array.isArray(paras) ? paras : paras?.[claim.paragraphSet!];
        if (Array.isArray(list) && typeof list[claim.itemIndex!] === 'string') {
          list[claim.itemIndex!] = removeViolatingSentences(list[claim.itemIndex!], bad);
        }
        break;
      }
    }
    removed.push(`${claim.section}: ${bad.join(', ')}`);
  }

  // Summary bullets string mirror (bullet-matrix keeps both)
  if (Array.isArray(cv.summaryBullets) && cv.summaryBullets.length > 0 && typeof cv.summary === 'string' && cv.summary.includes('•')) {
    cv.summary = cv.summaryBullets.map((b: string) => `• ${b}`).join('\n');
  }

  // Certifications: only those that appear in the profile
  if (Array.isArray(cv.certifications)) {
    const corpus = textOf({ ...profile, personas: undefined }).toLowerCase();
    const before = cv.certifications.length;
    cv.certifications = cv.certifications.filter((c: unknown) => {
      const name = typeof c === 'string' ? c : (c as any)?.name;
      if (!name) return false;
      const core = String(name).split(/[(|–-]/)[0].trim().toLowerCase();
      return core.length > 2 && corpus.includes(core);
    });
    if (cv.certifications.length < before) removed.push(`certifications: ${before - cv.certifications.length} removed`);
  }

  return { removed };
}
