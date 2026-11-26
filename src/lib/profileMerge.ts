/**
 * Applying an AI profile import (PDF / GitHub / LinkedIn) to an existing vault.
 *  - merge:   keep everything the user has; fill empty personal fields; append
 *             imported entries that aren't already there
 *  - replace: take the imported personal details and lists, but keep the photo,
 *             signature, custom sections and personas the import can't provide
 */

const PERSONAL_FIELDS = [
  'fullName', 'email', 'phone', 'website', 'github', 'linkedin', 'address',
  'dateOfBirth', 'birthplace', 'nationality',
] as const;

const LIST_KEYS: Record<string, (item: any) => string> = {
  workExperience: (j) => `${j?.company || ''}|${j?.role || ''}`,
  education: (e) => `${e?.institution || ''}|${e?.degree || ''}`,
  skills: (s) => (typeof s === 'string' ? s : s?.name || ''),
  languages: (l) => (typeof l === 'string' ? l : l?.language || ''),
  projects: (p) => p?.name || '',
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9|]+/g, ' ').trim();
const isBlank = (v: unknown) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

export function hasVaultContent(profile: any): boolean {
  if (!profile) return false;
  return Object.keys(LIST_KEYS).some(k => Array.isArray(profile[k]) && profile[k].length > 0);
}

export function mergeImportedProfile<T extends Record<string, any>>(current: T, imported: Record<string, any>): T {
  const next: Record<string, any> = { ...current };
  for (const field of PERSONAL_FIELDS) {
    if (isBlank(next[field]) && !isBlank(imported?.[field])) next[field] = imported[field];
  }
  for (const [key, keyOf] of Object.entries(LIST_KEYS)) {
    const existing: any[] = Array.isArray(current[key]) ? current[key] : [];
    const incoming: any[] = Array.isArray(imported?.[key]) ? imported[key] : [];
    const seen = new Set(existing.map(item => norm(keyOf(item))));
    const additions = incoming.filter(item => {
      const k = norm(keyOf(item));
      if (!k || k === '|' || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    next[key] = [...existing, ...additions];
  }
  return next as T;
}

export function replaceWithImported<T extends Record<string, any>>(current: T, imported: Record<string, any>): T {
  const next: Record<string, any> = { ...current };
  for (const field of PERSONAL_FIELDS) {
    if (!isBlank(imported?.[field])) next[field] = imported[field];
  }
  for (const key of Object.keys(LIST_KEYS)) {
    next[key] = Array.isArray(imported?.[key]) ? imported[key] : [];
  }
  return next as T;
}
