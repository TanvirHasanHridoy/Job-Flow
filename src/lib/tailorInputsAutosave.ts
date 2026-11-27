/**
 * Local autosave for the Tailor page's inputs (UX audit section 5, "Autosave of tailor inputs").
 *
 * Before a CV is generated nothing is stored on the server, so leaving the page
 * used to lose the pasted job description and every option. These helpers keep
 * a copy in localStorage. Once a generation succeeds the server draft takes over
 * and the local copy is cleared.
 */

export const TAILOR_INPUTS_KEY = 'jobflow:tailor-inputs:v1';

/** Older copies are ignored: a week-old pasted job is more likely noise than help. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface TailorInputs {
  jobDescription: string;
  jobUrl: string;
  intakeMethod: 'text' | 'url' | 'pdf';
  companyName: string;
  roleName: string;
  cvLanguage: 'EN' | 'DE';
  clLanguage: 'EN' | 'DE';
  salaryExpectation: string;
  noticePeriod: string;
  signingLocation: string;
  customNotes: string;
  themeDirective: string;
  matchStrategy: 'TACTICAL_PIVOT' | 'AGGRESIVE_BRIDGING';
  tone: string;
  lengthTarget: string;
}

interface Stored {
  savedAt: number;
  inputs: Partial<TailorInputs>;
}

/** True when there is nothing worth restoring. */
export function isEmptyInputs(i: Partial<TailorInputs>): boolean {
  return !(
    i.jobDescription?.trim() ||
    i.jobUrl?.trim() ||
    i.companyName?.trim() ||
    i.roleName?.trim() ||
    i.customNotes?.trim() ||
    i.themeDirective?.trim()
  );
}

export function loadTailorInputs(): Partial<TailorInputs> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(TAILOR_INPUTS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    if (!parsed || typeof parsed.savedAt !== 'number' || Date.now() - parsed.savedAt > MAX_AGE_MS) {
      window.localStorage.removeItem(TAILOR_INPUTS_KEY);
      return null;
    }
    return parsed.inputs && !isEmptyInputs(parsed.inputs) ? parsed.inputs : null;
  } catch {
    return null;
  }
}

export function saveTailorInputs(inputs: TailorInputs): void {
  if (typeof window === 'undefined') return;
  try {
    if (isEmptyInputs(inputs)) {
      window.localStorage.removeItem(TAILOR_INPUTS_KEY);
      return;
    }
    const value: Stored = { savedAt: Date.now(), inputs };
    window.localStorage.setItem(TAILOR_INPUTS_KEY, JSON.stringify(value));
  } catch {
    // Storage full or disabled (private mode): autosave is best-effort.
  }
}

export function clearTailorInputs(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(TAILOR_INPUTS_KEY);
  } catch {
    // ignore
  }
}
