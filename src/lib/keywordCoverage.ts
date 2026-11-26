/**
 * Keyword coverage (v2 Phase 3.3): how many of the job's keywords actually appear
 * in the CV text as it will be exported — what ATS keyword filters scan for.
 *
 * This is deliberately different from "profile fit" (matchScore), which measures
 * how well the candidate's whole profile meets the job's requirements.
 */
import { termPattern } from './bridging';
import type { Requirement } from './requirements';

export interface KeywordCoverage {
  found: string[];
  missing: string[];
  total: number;
  percentage: number;
}

// Requirement kinds that ATS filters match as keywords (years / degrees are parsed differently)
const KEYWORD_CATEGORIES = new Set(['skill', 'language', 'certification', 'other']);

function cvText(cv: any, bulletVariant: 'star' | 'punchy' | 'standard'): string {
  if (!cv) return '';
  const parts: string[] = [];
  const push = (v: unknown) => { if (typeof v === 'string') parts.push(v); };
  push(cv.summary);
  (cv.summaryBullets || []).forEach(push);
  for (const job of cv.workExperience || []) {
    push(job?.role);
    const b = job?.bullets;
    (Array.isArray(b) ? b : (b?.[bulletVariant] || b?.star || [])).forEach(push);
  }
  for (const s of cv.skills || []) push(typeof s === 'string' ? s : s?.name);
  for (const p of cv.projects || []) {
    push(p?.name);
    push(p?.description);
    (Array.isArray(p?.technologies) ? p.technologies : []).forEach(push);
  }
  for (const l of cv.languages || []) push(typeof l === 'string' ? l : `${l?.language || ''} ${l?.level || ''}`);
  (cv.certifications || []).forEach(push);
  return parts.join('\n').replace(/<[^>]+>/g, ' ');
}

function contains(text: string, term: string): boolean {
  const re = termPattern(term);
  if (re) return re.test(text);
  // very short terms (e.g. "Go", "R"): exact, case-sensitive word match
  return new RegExp(`(^|[^A-Za-z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![A-Za-z0-9])`).test(text);
}

export function computeKeywordCoverage(input: {
  tailoredCv: any;
  requirements?: Requirement[];
  legacyKeywords?: string[];      // results created before v2 (no requirement list)
  bulletVariant: 'star' | 'punchy' | 'standard';
}): KeywordCoverage | null {
  const text = cvText(input.tailoredCv, input.bulletVariant);
  if (!text.trim()) return null;

  // One entry per requirement: covered if any of its keywords is in the CV
  const groups: Array<{ label: string; terms: string[] }> = Array.isArray(input.requirements) && input.requirements.length > 0
    ? input.requirements
        .filter(r => KEYWORD_CATEGORIES.has(r.category))
        .map(r => ({ label: r.terms[0] || r.requirement, terms: r.terms }))
    : (input.legacyKeywords || []).filter(Boolean).map(k => ({ label: k, terms: [k] }));

  if (groups.length === 0) return null;
  const found: string[] = [];
  const missing: string[] = [];
  for (const g of groups) {
    (g.terms.some(t => contains(text, t)) ? found : missing).push(g.label);
  }
  return { found, missing, total: groups.length, percentage: Math.round((found.length / groups.length) * 100) };
}
