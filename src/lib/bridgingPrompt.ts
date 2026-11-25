import { formatRequirementsForPrompt, type Requirement } from './requirements';

/**
 * Generation-prompt block for controlled gap bridging (v2 Phase 2), shared by the
 * Visual/ATS and Bullet Matrix prompts. It hands the model the requirement
 * analysis and the rules for each strategy. Hard lines are also enforced in code
 * after generation (src/lib/bridging.ts) — the prompt is the first line of defence.
 */
export function buildBridgingDirective(opts: {
  matchStrategy: string;
  requirements: Requirement[];
  cvLanguage: 'EN' | 'DE' | string;
  clLanguage: 'EN' | 'DE' | string;
}): string {
  const { matchStrategy, requirements, clLanguage } = opts;
  const aggressive = matchStrategy === 'AGGRESIVE_BRIDGING' || matchStrategy === 'AGGRESSIVE_BRIDGING';
  const clLang = clLanguage === 'DE' ? 'German' : 'English';

  const strategy = aggressive
    ? `STRATEGY: AGGRESSIVE BRIDGING
- [MATCH] requirements: showcase them strongly, using the job's exact terminology.
- [ADJACENT] requirements: you MAY present the target skill as hands-on experience. Attach it ONLY to the job or project where the related "bridge from" skill was actually used, and phrase it plausibly alongside that skill
  (e.g. bridge "React" from "Angular": "Built component-based SPA dashboards in Angular and React"). Do not attach it to unrelated jobs.
- [GAP] requirements: NEVER claim them anywhere in the CV (no bullets, summary or skills list). The cover letter may acknowledge them briefly and positively.
- Metrics: prefer metrics from the profile. You may add a modest, plausible figure where it clearly strengthens a bridged claim; never inflate existing figures.`
    : `STRATEGY: TACTICAL PIVOT (honest justification)
- [MATCH] requirements: showcase them strongly, using the job's exact terminology.
- [ADJACENT] requirements: do NOT claim the target skill as experience. Highlight the related skill and frame it as transferable
  (e.g. "Built component-based SPAs in Angular — directly transferable to React").
- [GAP] requirements: never claim them in the CV.
- Cover letter: explicitly and constructively address the most important ADJACENT and GAP requirements in ${clLang} — what related experience the candidate brings and how they will close the gap. Do not pretend the gaps don't exist.
- Metrics: use only figures that appear in the profile. Do not invent numbers.`;

  return `GAP BRIDGING RULES (highest priority — they override any other instruction, including the tone or theme):

REQUIREMENT ANALYSIS (already computed — use it, do not redo it):
${formatRequirementsForPrompt(requirements)}

${strategy}

HARD LINES — never invent or alter, in any strategy:
- Employers / company names, job titles, employment dates.
- Degrees, schools/universities, certifications, licences.
Job titles must be copied exactly as they appear in the profile.

GENERAL:
- Do NOT force a number into every bullet. A strong, specific bullet without a metric is better than an invented one.
- Do not mention technologies that are neither in the profile nor an [ADJACENT] requirement.
- Do not move a technology from one job to another job where the profile does not show it (except ADJACENT bridges under Aggressive Bridging).`;
}

/** First city in a free-text address like "Berlin, Germany" -> "Berlin". */
export function cityFromAddress(address?: string | null): string {
  if (!address) return '';
  const first = address.split(/[,\n]/)[0]?.trim() || '';
  // Drop a leading postcode ("10115 Berlin" -> "Berlin")
  return first.replace(/^\d{4,6}\s+/, '');
}
