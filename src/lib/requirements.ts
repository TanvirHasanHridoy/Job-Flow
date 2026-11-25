/**
 * Requirement analysis for controlled gap bridging (v2 Phase 2).
 *
 * Step 1 of tailoring: a small AI call lists the job's requirements and classifies
 * each one against the candidate profile:
 *   MATCH    – the profile has it
 *   ADJACENT – the profile has a related skill in the same family (bridgeable)
 *   GAP      – nothing related in the profile (never bridged)
 *
 * Everything after the AI call (validation, coverage, score, the refusal gate) is
 * deterministic code. This module is isomorphic (no Node-only imports) so the
 * browser can reuse the types and scoring.
 */

export type RequirementStatus = 'MATCH' | 'ADJACENT' | 'GAP';
export type RequirementCategory = 'skill' | 'experience' | 'education' | 'certification' | 'language' | 'other';
export type RequirementImportance = 'must' | 'nice';

export interface Requirement {
  requirement: string;           // short paraphrase of the job requirement
  terms: string[];               // concrete keywords to look for (e.g. ["React", "Redux"])
  category: RequirementCategory;
  importance: RequirementImportance;
  status: RequirementStatus;
  evidence?: string;             // profile fact supporting MATCH / ADJACENT
  bridgeFrom?: string;           // related profile skill used to bridge (ADJACENT)
}

export interface RequirementAnalysis {
  requirements: Requirement[];
  mustHaveCount: number;
  mustHaveCovered: number;
  mustCoverage: number;          // 0..1, (MATCH + ADJACENT) / must-haves
  matchScore: number;            // 0..100, weighted
  feasible: boolean;
  threshold: number;             // minimum mustCoverage to generate
  recommendations: string;       // markdown: positives / negatives / advice
}

/** Owner decision (2026-11-25): refuse when under 50% of must-haves are covered. */
export const FEASIBILITY_THRESHOLD = 0.5;

/** Credentials and experience length can't be bridged — only MATCH or GAP. */
const NON_BRIDGEABLE: RequirementCategory[] = ['education', 'certification', 'experience'];

const CATEGORIES: RequirementCategory[] = ['skill', 'experience', 'education', 'certification', 'language', 'other'];

export function buildRequirementAnalysisPrompt(cvLanguage: 'EN' | 'DE'): string {
  return `You are a precise technical recruiter. Compare a job description with a candidate profile.

TASK
1. Extract every distinct requirement from the job description (skills, tools, experience length, education, certifications/licences, spoken languages, domain knowledge). Merge duplicates. Usually 6–20 requirements.
2. Mark each as "must" (required / essential / "you bring", "must have", "required") or "nice" ("plus", "nice to have", "ideally", "bonus", "preferred").
3. Classify each against the candidate profile:
   - "MATCH": the profile clearly shows it (same skill, or the same technology under another name, e.g. "Postgres" = "PostgreSQL").
   - "ADJACENT": the profile does not show it, but shows a closely related skill from the SAME family that would let the candidate credibly pick it up quickly.
       Examples: Angular -> React, Vue -> React, Flask -> FastAPI, Django -> FastAPI, MySQL -> PostgreSQL, Jest -> Cypress/Vitest, Playwright -> Cypress, AWS ECS/Docker -> Kubernetes basics, Express -> NestJS, GitHub Actions -> GitLab CI, Dutch -> German (spoken).
       NOT adjacent: a different language family (JavaScript -> Java, Python -> Go), a frontend skill for a backend requirement, anything vague.
   - "GAP": nothing related in the profile.
4. Education, certifications/licences and years-of-experience requirements can ONLY be "MATCH" or "GAP" (never "ADJACENT").
5. Be honest and strict. Do not mark something MATCH unless the profile actually shows it.

Return a raw JSON object with exactly this shape:
{
  "requirements": [
    {
      "requirement": "<short paraphrase, max 12 words>",
      "terms": ["<1-3 concrete keywords exactly as a CV would write them, e.g. 'React', 'Spring Boot', 'Master's degree'>"],
      "category": "skill" | "experience" | "education" | "certification" | "language" | "other",
      "importance": "must" | "nice",
      "status": "MATCH" | "ADJACENT" | "GAP",
      "evidence": "<the profile fact that supports MATCH/ADJACENT, else empty>",
      "bridgeFrom": "<for ADJACENT only: the related profile skill, e.g. 'Angular'>"
    }
  ],
  "recommendations": "<markdown in ${cvLanguage === 'DE' ? 'German' : 'English'} with exactly these headings: ### Positives\\n- ...\\n\\n### Negatives\\n- ...\\n\\n### Actionable Advice\\n- ...>"
}`;
}

function asString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

/**
 * Validates and normalises the raw AI output, then computes coverage, score and
 * feasibility deterministically.
 */
export function normalizeRequirementAnalysis(raw: any): RequirementAnalysis {
  const list: any[] = Array.isArray(raw?.requirements) ? raw.requirements : [];
  const requirements: Requirement[] = [];

  for (const item of list) {
    const requirement = asString(item?.requirement);
    if (!requirement) continue;

    const category: RequirementCategory = CATEGORIES.includes(item?.category) ? item.category : 'other';
    const importance: RequirementImportance = item?.importance === 'nice' ? 'nice' : 'must';
    let status: RequirementStatus = ['MATCH', 'ADJACENT', 'GAP'].includes(item?.status) ? item.status : 'GAP';
    let bridgeFrom = asString(item?.bridgeFrom);

    if (status === 'ADJACENT' && (NON_BRIDGEABLE.includes(category) || !bridgeFrom)) {
      status = 'GAP';
    }
    if (status !== 'ADJACENT') bridgeFrom = '';

    const terms = (Array.isArray(item?.terms) ? item.terms : [])
      .map(asString)
      .filter((t: string) => t.length > 0 && t.length <= 60)
      .slice(0, 4);

    requirements.push({
      requirement,
      terms: terms.length > 0 ? terms : [requirement],
      category,
      importance,
      status,
      evidence: asString(item?.evidence) || undefined,
      bridgeFrom: bridgeFrom || undefined,
    });
  }

  return {
    ...scoreRequirements(requirements),
    requirements,
    recommendations: asString(raw?.recommendations),
  };
}

/**
 * Deterministic coverage and match score.
 * - Coverage (gate): share of must-haves that are MATCH or ADJACENT.
 *   If the ad lists no must-haves, all requirements are used.
 * - Score: weighted, must = 2 / nice = 1; MATCH = 1, ADJACENT = 0.5, GAP = 0.
 *   An empty analysis scores 0, never 100.
 */
export function scoreRequirements(requirements: Requirement[]) {
  const musts = requirements.filter(r => r.importance === 'must');
  const gateSet = musts.length > 0 ? musts : requirements;
  const covered = gateSet.filter(r => r.status !== 'GAP').length;
  const mustCoverage = gateSet.length > 0 ? covered / gateSet.length : 0;

  let weightSum = 0;
  let valueSum = 0;
  for (const r of requirements) {
    const w = r.importance === 'must' ? 2 : 1;
    const v = r.status === 'MATCH' ? 1 : r.status === 'ADJACENT' ? 0.5 : 0;
    weightSum += w;
    valueSum += w * v;
  }
  const matchScore = weightSum > 0 ? Math.round((valueSum / weightSum) * 100) : 0;

  return {
    mustHaveCount: gateSet.length,
    mustHaveCovered: covered,
    mustCoverage,
    matchScore,
    feasible: gateSet.length > 0 && mustCoverage >= FEASIBILITY_THRESHOLD,
    threshold: FEASIBILITY_THRESHOLD,
  };
}

/**
 * Legacy gap-analysis arrays (exactMatches / adjacentMatches / missingSkills) used by
 * the existing UI (scorecard, ATS highlights), derived from the requirement list.
 */
export function toLegacyGapArrays(requirements: Requirement[]) {
  const first = (r: Requirement) => r.terms[0] || r.requirement;
  return {
    exactMatches: requirements.filter(r => r.status === 'MATCH').map(first),
    adjacentMatches: requirements.filter(r => r.status === 'ADJACENT').map(first),
    missingSkills: requirements.filter(r => r.status === 'GAP').map(r => r.requirement),
  };
}

/* ------------------------------------------------------------------ */
/* Experience length (computed in code — models can't do date math    */
/* reliably and don't know today's date)                               */
/* ------------------------------------------------------------------ */

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  januar: 0, februar: 1, märz: 2, maerz: 2, mai: 4, juni: 5, juli: 6, okt: 9, dez: 11,
};

/** Parses "03/2023", "2023-03", "March 2023", "Mär 2023", "2023". Returns months since year 0. */
function parseMonth(raw: unknown, today: Date): number | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const s = raw.trim().toLowerCase();
  if (/^(present|current|now|today|heute|aktuell|laufend|bis heute)$/.test(s)) return today.getFullYear() * 12 + today.getMonth();
  let m = s.match(/^(\d{1,2})[./-](\d{4})$/);
  if (m) return Number(m[2]) * 12 + Math.min(11, Math.max(0, Number(m[1]) - 1));
  m = s.match(/^(\d{4})[./-](\d{1,2})/);
  if (m) return Number(m[1]) * 12 + Math.min(11, Math.max(0, Number(m[2]) - 1));
  m = s.match(/^([a-zäöü]+)\.?\s+(\d{4})$/);
  if (m) {
    const key = Object.keys(MONTHS).find(k => m![1].startsWith(k));
    if (key !== undefined) return Number(m[2]) * 12 + MONTHS[key];
  }
  m = s.match(/^(\d{4})$/);
  if (m) return Number(m[1]) * 12;
  return null;
}

const INTERNSHIP_RE = /\b(intern|internship|praktik\w*|werkstudent\w*|working student|trainee|apprentice|azubi)\b/i;

/**
 * Total professional experience in years (overlaps merged), with and without
 * internships / working-student roles.
 */
export function computeExperienceYears(workExperience: any[], today = new Date()): { total: number; excludingInternships: number } {
  const intervals = (Array.isArray(workExperience) ? workExperience : [])
    .map(j => {
      const start = parseMonth(j?.startDate, today);
      const isCurrent = j?.current === true || j?.current === 'true' || !j?.endDate || String(j.endDate).trim() === '';
      const end = isCurrent ? parseMonth('present', today) : parseMonth(j?.endDate, today);
      if (start === null || end === null || end < start) return null;
      return { start, end: end + 1, intern: INTERNSHIP_RE.test(String(j?.role || '')) };
    })
    .filter((x): x is { start: number; end: number; intern: boolean } => x !== null);

  const merged = (list: typeof intervals) => {
    const sorted = [...list].sort((a, b) => a.start - b.start);
    let months = 0;
    let cur: { start: number; end: number } | null = null;
    for (const iv of sorted) {
      if (!cur || iv.start > cur.end) {
        if (cur) months += cur.end - cur.start;
        cur = { start: iv.start, end: iv.end };
      } else {
        cur.end = Math.max(cur.end, iv.end);
      }
    }
    if (cur) months += cur.end - cur.start;
    return Math.round((months / 12) * 10) / 10;
  };

  return { total: merged(intervals), excludingInternships: merged(intervals.filter(i => !i.intern)) };
}

/** Compact table of the analysis for the generation prompt. */
export function formatRequirementsForPrompt(requirements: Requirement[]): string {
  return requirements
    .map((r, i) => {
      const bridge = r.status === 'ADJACENT' ? ` | bridge from: ${r.bridgeFrom}` : '';
      return `${i + 1}. [${r.status}] [${r.importance}] ${r.requirement} | keywords: ${r.terms.join(', ')}${bridge}`;
    })
    .join('\n');
}
