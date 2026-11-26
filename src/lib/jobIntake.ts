import * as cheerio from 'cheerio';
import { safeFetch } from './safeFetch';

/**
 * Structured job-posting intake (v2 Phase 5). No AI involved:
 *   1. Job-board public APIs (Greenhouse, SmartRecruiters, plus closed-checks for Lever / Ashby)
 *   2. schema.org JobPosting JSON-LD embedded in the page (Personio, Lever, Ashby, StepStone,
 *      many company career sites — anything published for Google Jobs)
 * The caller falls back to the paid AI extraction only if both find nothing.
 */

export interface StructuredJob {
  roleName: string;
  companyName: string;
  jobDescription: string;
  location?: string;
  employmentType?: string;
  source: string;            // e.g. "Greenhouse API", "Structured data (JSON-LD)"
  warning?: string;          // possibly expired (owner decision: warn, still import)
}

export type IntakeResult =
  | { kind: 'ok'; job: StructuredJob }
  | { kind: 'closed'; message: string }
  | { kind: 'none'; page?: { status: number; html: string; finalUrl: string } };

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const MAX_DESCRIPTION_CHARS = 20000;

const CLOSED_MESSAGE = 'This job posting is closed or no longer exists. Nothing was charged. If you still have the text, paste it into the workspace.';

/* ------------------------------------------------------------------ */
/* HTML -> readable text                                               */
/* ------------------------------------------------------------------ */

export function htmlToText(html: string): string {
  if (!html) return '';
  // Some APIs (Greenhouse) return entity-escaped HTML: decode once first
  let source = html;
  if (/&lt;\/?[a-z]/i.test(source) && !/<\/?[a-z][^>]*>/i.test(source)) {
    source = cheerio.load(`<div>${source}</div>`)('div').text();
  }
  const $ = cheerio.load(`<div id="root">${source}</div>`);
  $('script, style, noscript, iframe, img, svg').remove();
  $('h1, h2, h3, h4, h5, h6').each((_, el) => { $(el).replaceWith(`\n\n## ${$(el).text().trim()}\n`); });
  $('li').each((_, el) => { $(el).replaceWith(`\n- ${$(el).text().trim()}`); });
  $('br').replaceWith('\n');
  $('p, div, ul, ol, section, tr').each((_, el) => { $(el).append('\n'); });
  let text = $('#root').text()
    .replace(/ /g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n\n(?=- )/g, '\n')          // no blank lines between bullet items
    .replace(/^## \s*$/gm, '')               // empty headings
    .trim();
  // Drop a heading/line repeated right after itself (nested heading markup)
  const lines = text.split('\n');
  text = lines.filter((line, i) => {
    if (!line.trim()) return true;
    let j = i - 1;
    while (j >= 0 && !lines[j].trim()) j--;
    return j < 0 || lines[j].trim() !== line.trim();
  }).join('\n').replace(/\n{3,}/g, '\n\n');
  return text.length > MAX_DESCRIPTION_CHARS ? text.slice(0, MAX_DESCRIPTION_CHARS) + '…' : text;
}

/* ------------------------------------------------------------------ */
/* Expiry signals (warn only)                                          */
/* ------------------------------------------------------------------ */

const EXPIRED_TEXT_RE = /(no longer accepting applications|this (job|position|posting) (is )?no longer (available|open|active)|position has been filled|job has expired|stelle ist (bereits )?besetzt|stellenanzeige ist nicht mehr verfügbar|nicht mehr (verfügbar|aktiv))/i;

function expiryWarning(opts: { validThrough?: unknown; text?: string }): string | undefined {
  if (typeof opts.validThrough === 'string' && opts.validThrough) {
    const d = new Date(opts.validThrough);
    if (!Number.isNaN(d.getTime()) && d.getTime() < Date.now()) {
      return `This posting's listed deadline (${d.toISOString().slice(0, 10)}) has passed — it may be closed. Check before applying.`;
    }
  }
  if (opts.text && EXPIRED_TEXT_RE.test(opts.text)) {
    return 'This page says the position may no longer be open. Check before applying.';
  }
  return undefined;
}

/* ------------------------------------------------------------------ */
/* Job-board detection                                                 */
/* ------------------------------------------------------------------ */

type AtsRef =
  | { ats: 'greenhouse'; board: string; id: string; eu: boolean }
  | { ats: 'lever'; company: string; id: string; eu: boolean }
  | { ats: 'ashby'; org: string; id: string }
  | { ats: 'smartrecruiters'; company: string; id: string };

export function detectAts(rawUrl: string): AtsRef | null {
  let url: URL;
  try { url = new URL(rawUrl); } catch { return null; }
  const host = url.hostname.toLowerCase();
  const parts = url.pathname.split('/').filter(Boolean);

  if (/(^|\.)greenhouse\.io$/.test(host)) {
    const i = parts.indexOf('jobs');
    if (i >= 1 && /^\d+$/.test(parts[i + 1] || '')) return { ats: 'greenhouse', board: parts[i - 1], id: parts[i + 1], eu: host.includes('.eu.') };
    const ghJid = url.searchParams.get('gh_jid');
    if (ghJid && /^\d+$/.test(ghJid) && parts[0]) return { ats: 'greenhouse', board: parts[0], id: ghJid, eu: host.includes('.eu.') };
  }
  if (host === 'jobs.lever.co' || host === 'jobs.eu.lever.co') {
    if (parts[0] && /^[0-9a-f-]{36}$/i.test(parts[1] || '')) return { ats: 'lever', company: parts[0], id: parts[1], eu: host.includes('.eu.') };
  }
  if (host === 'jobs.ashbyhq.com') {
    if (parts[0] && /^[0-9a-f-]{36}$/i.test(parts[1] || '')) return { ats: 'ashby', org: parts[0], id: parts[1] };
  }
  if (host === 'jobs.smartrecruiters.com' || host === 'careers.smartrecruiters.com') {
    const m = (parts[1] || '').match(/^(\d{6,})/);
    if (parts[0] && m) return { ats: 'smartrecruiters', company: parts[0], id: m[1] };
  }
  return null;
}

async function getJson(url: string): Promise<{ status: number; data: any }> {
  const { response } = await safeFetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
  if (!response.ok) return { status: response.status, data: null };
  return { status: response.status, data: await response.json().catch(() => null) };
}

/** Tier 1: public job-board APIs. Returns null when the API can't decide (fall through). */
async function fromAtsApi(ref: AtsRef): Promise<IntakeResult | null> {
  try {
    if (ref.ats === 'greenhouse') {
      const base = ref.eu ? 'https://boards-api.eu.greenhouse.io' : 'https://boards-api.greenhouse.io';
      const { status, data } = await getJson(`${base}/v1/boards/${encodeURIComponent(ref.board)}/jobs/${ref.id}`);
      if (status === 404 || status === 410) return { kind: 'closed', message: CLOSED_MESSAGE };
      if (!data?.title) return null;
      return {
        kind: 'ok',
        job: {
          roleName: String(data.title).trim(),
          companyName: String(data.company_name || ref.board).trim(),
          jobDescription: htmlToText(data.content || ''),
          location: data.location?.name || undefined,
          source: 'Greenhouse API',
          warning: expiryWarning({ validThrough: data.application_deadline }),
        },
      };
    }

    if (ref.ats === 'smartrecruiters') {
      const { status, data } = await getJson(`https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(ref.company)}/postings/${ref.id}`);
      if (status === 404 || status === 410) return { kind: 'closed', message: CLOSED_MESSAGE };
      if (!data?.name) return null;
      const s = data.jobAd?.sections || {};
      const block = (title: string, html?: string) => (html ? `## ${title}\n${htmlToText(html)}` : '');
      return {
        kind: 'ok',
        job: {
          roleName: String(data.name).trim(),
          companyName: String(data.company?.name || ref.company).trim(),
          jobDescription: [
            block('About the company', s.companyDescription?.text),
            block('Job description', s.jobDescription?.text),
            block('Qualifications', s.qualifications?.text),
            block('Additional information', s.additionalInformation?.text),
          ].filter(Boolean).join('\n\n'),
          location: [data.location?.city, data.location?.country?.toUpperCase()].filter(Boolean).join(', ') || undefined,
          employmentType: data.typeOfEmployment?.label,
          source: 'SmartRecruiters API',
        },
      };
    }

    // Lever / Ashby: the page's JSON-LD is richer (includes the company name), so the
    // API is only used to tell whether the posting is closed.
    if (ref.ats === 'lever') {
      const base = ref.eu ? 'https://api.eu.lever.co' : 'https://api.lever.co';
      const { status } = await getJson(`${base}/v0/postings/${encodeURIComponent(ref.company)}/${ref.id}`);
      if (status === 404 || status === 410) return { kind: 'closed', message: CLOSED_MESSAGE };
      return null;
    }

    if (ref.ats === 'ashby') {
      const { status, data } = await getJson(`https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(ref.org)}`);
      if (status === 200 && Array.isArray(data?.jobs) && !data.jobs.some((j: any) => j?.id === ref.id)) {
        return { kind: 'closed', message: CLOSED_MESSAGE };
      }
      return null;
    }
  } catch (err) {
    console.warn('[jobIntake] job-board API failed, falling back:', (err as Error).message);
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Tier 2: JSON-LD JobPosting                                          */
/* ------------------------------------------------------------------ */

function findJobPosting(node: any): any | null {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node)) {
    for (const n of node) { const f = findJobPosting(n); if (f) return f; }
    return null;
  }
  const type = node['@type'];
  if (type === 'JobPosting' || (Array.isArray(type) && type.includes('JobPosting'))) return node;
  if (node['@graph']) return findJobPosting(node['@graph']);
  return null;
}

function locationOf(jp: any): string | undefined {
  const locs = Array.isArray(jp.jobLocation) ? jp.jobLocation : jp.jobLocation ? [jp.jobLocation] : [];
  const names = locs
    .map((l: any) => l?.address)
    .filter(Boolean)
    .map((a: any) => (typeof a === 'string' ? a : [a.addressLocality, a.addressCountry?.name || a.addressCountry].filter(Boolean).join(', ')))
    .filter(Boolean);
  if (names.length) return Array.from(new Set(names)).slice(0, 3).join(' / ');
  if (jp.jobLocationType === 'TELECOMMUTE') return 'Remote';
  return undefined;
}

export function jobFromJsonLd(html: string): StructuredJob | null {
  const $ = cheerio.load(html);
  let posting: any = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    if (posting) return;
    try { posting = findJobPosting(JSON.parse($(el).contents().text())); } catch { /* ignore malformed blocks */ }
  });
  if (!posting?.title || !posting?.description) return null;

  const description = htmlToText(String(posting.description));
  if (description.length < 200) return null; // teaser only — let the AI path read the full page

  const org = posting.hiringOrganization;
  const companyName = typeof org === 'string' ? org : org?.name;
  const employmentType = Array.isArray(posting.employmentType) ? posting.employmentType.join(', ') : posting.employmentType;
  const pageText = $('body').text().slice(0, 20000);

  return {
    roleName: htmlToText(String(posting.title)),
    companyName: companyName ? String(companyName).trim() : '',
    jobDescription: description,
    location: locationOf(posting),
    employmentType: employmentType ? String(employmentType) : undefined,
    source: 'Structured data (JSON-LD)',
    warning: expiryWarning({ validThrough: posting.validThrough, text: `${description}\n${pageText}` }),
  };
}

/* ------------------------------------------------------------------ */
/* Orchestration                                                       */
/* ------------------------------------------------------------------ */

function looksLikeRedirectToListing(requested: string, final: string): boolean {
  if (requested === final) return false;
  try {
    const a = new URL(requested);
    const b = new URL(final);
    if (b.searchParams.get('error') === 'true') return true; // Greenhouse closed-job redirect
    // The job id (long number or UUID) disappeared from the URL -> landed on a listing page
    const ids = (a.pathname + a.search).match(/\d{5,}|[0-9a-f]{8}-[0-9a-f-]{27}/gi) || [];
    return ids.length > 0 && ids.every(id => !(b.pathname + b.search).includes(id));
  } catch {
    return false;
  }
}

/**
 * Free structured extraction. 'none' means: use the AI fallback (the fetched page is
 * returned so it isn't downloaded twice).
 */
export async function extractStructuredJob(url: string): Promise<IntakeResult> {
  const ref = detectAts(url);
  if (ref) {
    const api = await fromAtsApi(ref);
    if (api) return api;
  }

  let status = 0;
  let html = '';
  let finalUrl = url;
  try {
    const res = await safeFetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'en-US,en;q=0.8,de;q=0.6' },
      signal: AbortSignal.timeout(20000),
    });
    status = res.response.status;
    finalUrl = res.finalUrl;
    html = await res.response.text();
  } catch (err) {
    console.warn('[jobIntake] page fetch failed:', (err as Error).message);
    return { kind: 'none' };
  }

  if (status === 404 || status === 410) return { kind: 'closed', message: CLOSED_MESSAGE };
  if (looksLikeRedirectToListing(url, finalUrl)) return { kind: 'closed', message: CLOSED_MESSAGE };

  if (status < 400 && html) {
    const job = jobFromJsonLd(html);
    if (job) return { kind: 'ok', job };
  }
  return { kind: 'none', page: { status, html, finalUrl } };
}
