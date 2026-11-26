/**
 * Free, instant sanity check for pasted job descriptions (v2 Phase 3.1).
 * Runs in the browser before submitting and on the server before any tokens are
 * charged or AI is called. Deliberately lenient: it only rejects input that is
 * clearly not a job ad (too short, no job-ad language, or a pasted CV).
 */

export const MIN_JOB_DESCRIPTION_WORDS = 60;

export type JobDescriptionCheck =
  | { ok: true }
  | { ok: false; reason: 'empty' | 'too-short' | 'not-a-job-ad' | 'looks-like-cv'; message: string };

// Phrases typical of job ads (EN + DE). Each distinct hit counts once.
const JOB_SIGNALS: RegExp[] = [
  /\bresponsibilit(y|ies)\b/i, /\brequirements?\b/i, /\bqualifications?\b/i, /\bwhat you('ll| will)? (do|bring)\b/i,
  /\byou will\b/i, /\byou('ll| have| are| bring)\b/i, /\bwe are (looking|hiring|seeking)\b/i, /\bwe offer\b/i, /\bwhat we offer\b/i,
  /\byour (profile|tasks|role|responsibilities|skills)\b/i, /\babout (the|this) (role|position|job|team)\b/i,
  /\b(years? of|\d\+ years?) (of )?(professional )?experience\b/i, /\bexperience (with|in)\b/i, /\bnice to have\b/i,
  /\b(required|preferred|must[- ]have|mandatory|wünschenswert|vorausgesetzt)\b/i,
  /\b(engineer|developer|entwickler\w*|manager|designer|analyst|consultant|berater\w*|specialist|architect|lead)\b/i,
  /\b(full|part)[- ]time\b/i, /\b(remote|hybrid|on-?site)\b/i, /\bbenefits?\b/i, /\bsalary\b/i, /\bapply\b/i, /\bjoin (our|us|the)\b/i,
  /\(m\/w\/d\)|\(w\/m\/d\)|\(f\/m\/d\)|\(m\/f\/d\)|\(all genders\)/i,
  /\b(ihre|deine) aufgaben\b/i, /\b(ihr|dein) profil\b/i, /\bwir bieten\b/i, /\banforderungen\b/i, /\bkenntnisse\b/i,
  /\berfahrung (in|mit)\b/i, /\bbewerb(ung|en)\b/i, /\bwas (du|sie) mitbringst|mitbringen\b/i, /\bwir suchen\b/i, /\bstelle\b/i,
];

// Section headings typical of CVs.
const CV_HEADINGS: RegExp[] = [
  /^\s*(work |professional )?experience\s*$/im, /^\s*education\s*$/im, /^\s*(technical )?skills\s*$/im, /^\s*languages\s*$/im,
  /^\s*(professional )?summary\s*$/im, /^\s*projects\s*$/im, /^\s*certifications?\s*$/im,
  /^\s*berufserfahrung\s*$/im, /^\s*(aus)?bildung(sweg)?\s*$/im, /^\s*kenntnisse\s*$/im, /^\s*sprachen\s*$/im, /^\s*lebenslauf\s*$/im,
];

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const PHONE_RE = /(\+\d{1,3}[\s-]?)?(\(?\d{2,5}\)?[\s-]?){2,}\d{3,}/;
const DATE_RANGE_RE = /\b(0?[1-9]|1[0-2])[/.](19|20)\d{2}\s*[–-]\s*((0?[1-9]|1[0-2])[/.](19|20)\d{2}|present|heute|today)/gi;

export function checkJobDescription(text: unknown): JobDescriptionCheck {
  const raw = typeof text === 'string' ? text.trim() : '';
  if (!raw) {
    return { ok: false, reason: 'empty', message: 'Please paste the job description.' };
  }

  const words = raw.split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w));
  if (words.length < MIN_JOB_DESCRIPTION_WORDS) {
    return {
      ok: false,
      reason: 'too-short',
      message: `This job description is very short (${words.length} words). Please paste the full posting — responsibilities and requirements — so the match is accurate.`,
    };
  }

  const jobSignals = JOB_SIGNALS.filter(re => re.test(raw)).length;
  const cvHeadings = CV_HEADINGS.filter(re => re.test(raw)).length;
  const dateRanges = (raw.match(DATE_RANGE_RE) || []).length;
  const hasContact = EMAIL_RE.test(raw) && PHONE_RE.test(raw);

  // A CV: contact details plus CV section headings or several employment date ranges,
  // and little job-ad language.
  if (hasContact && (cvHeadings >= 2 || dateRanges >= 2) && jobSignals < 4) {
    return {
      ok: false,
      reason: 'looks-like-cv',
      message: 'This looks like a CV rather than a job description. Paste the job posting here — your own details come from your Master Vault.',
    };
  }

  if (jobSignals < 2) {
    return {
      ok: false,
      reason: 'not-a-job-ad',
      message: "This text doesn't look like a job description (no responsibilities, requirements or similar). Please paste the full job posting.",
    };
  }

  return { ok: true };
}
