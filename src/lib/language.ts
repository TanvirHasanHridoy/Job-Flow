/**
 * Lightweight language check for job descriptions (v2 Phase 7.3).
 * Compares how often common German vs English function words occur, so an
 * English ad mentioning "die", "der" or "Kenntnisse" doesn't trigger a
 * translation call.
 */
const GERMAN = new Set([
  'und', 'der', 'die', 'das', 'ist', 'mit', 'für', 'von', 'auf', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einer',
  'zum', 'zur', 'nicht', 'wir', 'sie', 'du', 'dich', 'dir', 'ihre', 'ihr', 'deine', 'dein', 'bei', 'oder', 'als', 'auch',
  'sowie', 'werden', 'wird', 'sind', 'bist', 'hast', 'haben', 'über', 'unser', 'unsere', 'uns', 'im', 'in', 'an', 'aus',
]);
const ENGLISH = new Set([
  'the', 'and', 'of', 'to', 'with', 'for', 'in', 'is', 'are', 'you', 'we', 'our', 'your', 'will', 'a', 'an', 'on', 'as',
  'be', 'or', 'from', 'at', 'by', 'this', 'that', 'have', 'has', 'who', 'what', 'about', 'us',
]);

export function looksGerman(text: string): boolean {
  const words = (text || '').toLowerCase().match(/[a-zäöüß]+/g) || [];
  let de = 0;
  let en = 0;
  for (const w of words) {
    // "in" is in both lists; count it for neither
    if (w === 'in') continue;
    if (GERMAN.has(w)) de++;
    else if (ENGLISH.has(w)) en++;
  }
  // Clearly German: enough German function words and more than English ones
  return de >= 8 && de > en * 1.2;
}
