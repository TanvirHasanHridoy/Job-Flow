/**
 * Display helpers for the AI's keyword lists.
 *
 * The model sometimes returns the same keyword twice ("React", "react") and can
 * list a keyword as both matching and missing. Showing that verbatim makes the
 * insight panels contradict themselves (UX audit 7.3), so every UI that renders
 * these lists should pass them through here first.
 */

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

/** Case-insensitive de-duplication that keeps the first spelling seen. */
export function dedupeKeywords(list: readonly (string | null | undefined)[] | null | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of list ?? []) {
    if (typeof raw !== 'string') continue;
    const k = norm(raw);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(raw.trim());
  }
  return out;
}

/**
 * De-duplicated matching and missing lists where a keyword is never in both.
 * A keyword the model calls "missing" is treated as missing: it is the safer
 * reading for the user, who should not claim a skill they may not have.
 */
export function cleanKeywordLists(
  matching: readonly (string | null | undefined)[] | null | undefined,
  missing: readonly (string | null | undefined)[] | null | undefined
): { matching: string[]; missing: string[] } {
  const cleanMissing = dedupeKeywords(missing);
  const missingSet = new Set(cleanMissing.map(norm));
  const cleanMatching = dedupeKeywords(matching).filter(k => !missingSet.has(norm(k)));
  return { matching: cleanMatching, missing: cleanMissing };
}
