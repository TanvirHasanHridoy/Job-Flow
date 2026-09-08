import { JobSiteParser, ParsedJobData } from './types';

function cleanText(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

const JUNK_TITLE_PATTERNS = [
  /^\s*\d+[\d,]*\s+(jobs|stellen|treffer)\b/i,
  /\b\d+[\d,]*\s+(jobs|stellen|treffer)\b/i,
  /\b(jobs|stellen|treffer)\s+(found|gefunden)\b/i,
  /^\s*\d+[\d,]*\+?.*(jobs|stellen)\b/i,
  /jobsuche/i,
  /^search\b/i,
  /recommended/i,
  /empfehlungen/i,
  /not available/i,
  /gespeicherte jobs/i,
  /^xing\b/i,
  /finde deinen/i
];

const JUNK_COMPANY_WORDS = [
  'urgently hiring',
  'dringend gesucht',
  'top job',
  'anzeige',
  'sponsored',
  'featured',
  'neu',
  'new',
  'xing',
  'kununu',
  'new work se'
];

function isJunkTitle(title: string): boolean {
  if (!title || title.length < 3) return true;
  return JUNK_TITLE_PATTERNS.some(p => p.test(title));
}

function isJunkCompany(company: string): boolean {
  if (!company || company.length < 2) return true;
  const lower = company.toLowerCase().trim();
  return JUNK_COMPANY_WORDS.some(j => lower.includes(j));
}

function extractStructuredDescription(container: Element | null): string {
  if (!container) return '';
  const clone = container.cloneNode(true) as HTMLElement;

  clone.querySelectorAll('button, svg, script, style, nav, footer, header').forEach(el => el.remove());

  clone.querySelectorAll('li').forEach(li => {
    li.textContent = `\n• ${li.textContent?.trim() || ''}`;
  });

  clone.querySelectorAll('h1, h2, h3, h4, h5, h6, p').forEach(p => {
    p.textContent = `\n${p.textContent?.trim() || ''}\n`;
  });

  const raw = clone.innerText || clone.textContent || '';
  return raw
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
}

export const xingParser: JobSiteParser = {
  name: 'Xing',
  matches(url: string) {
    return /xing\.com\/jobs/i.test(url);
  },
  parse(): ParsedJobData | null {
    // 1. Role Title Candidates (checked in priority order)
    let title = '';
    let matchedTitleEl: Element | null = null;
    const titleCandidates = document.querySelectorAll(
      '[data-testid="job-title"], ' +
      '[data-testid="job-teaser-list-title"], ' +
      '[data-testid="job-teaser-card-title"], ' +
      'h1[class*="job-title"], ' +
      'h2[class*="job-title"], ' +
      '[data-testid="headline"]'
    );
    for (const el of titleCandidates) {
      const txt = cleanText(el.textContent);
      if (!isJunkTitle(txt)) {
        title = txt;
        matchedTitleEl = el;
        break;
      }
    }

    // 2. Company Candidates (checked in priority order)
    let company = '';
    const companyCandidates = document.querySelectorAll(
      '[data-testid="company-name"], ' +
      '[data-testid="job-teaser-card-company"], ' +
      '[data-testid="job-teaser-list-company"], ' +
      'a[href*="/companies/"], ' +
      'a[href*="/company/"], ' +
      'div[class*="company-name"]'
    );
    for (const el of companyCandidates) {
      const txt = cleanText(el.textContent);
      if (!isJunkCompany(txt)) {
        company = txt;
        break;
      }
    }

    // If company was not in a separate testid, parse the card container around the matched title
    if (!company && matchedTitleEl) {
      const card = matchedTitleEl.closest('div[class*="job-teaser"], article, li');
      if (card) {
        const lines = (card as HTMLElement).innerText?.split('\n').map(l => l.trim()).filter(Boolean) || [];
        for (const line of lines) {
          if (line !== title && !isJunkCompany(line) && !isJunkTitle(line) && line.length > 2) {
            company = line;
            break;
          }
        }
      }
    }

    // 3. Location
    const locEl = document.querySelector(
      '[data-testid="job-location"], ' +
      '[data-testid="location"], ' +
      '[data-testid="workplace-type"], ' +
      'span[class*="location"]'
    );
    let location = cleanText(locEl?.textContent);
    if (!location && matchedTitleEl) {
      const card = matchedTitleEl.closest('div[class*="job-teaser"], article, li');
      if (card) {
        const lines = (card as HTMLElement).innerText?.split('\n').map(l => l.trim()).filter(Boolean) || [];
        // Typically title -> company -> location
        const foundIndex = lines.indexOf(company);
        if (foundIndex !== -1 && lines[foundIndex + 1]) {
          location = lines[foundIndex + 1];
        }
      }
    }

    // 4. Description
    const descEl = document.querySelector(
      '[data-testid="job-description"], ' +
      '[data-testid="description-content"], ' +
      'article[class*="job-description"], ' +
      'article[data-testid="job-search-result"]'
    );
    let description = extractStructuredDescription(descEl);

    // Fallback description from teaser card text if on search listing
    if (!description && matchedTitleEl) {
      const card = matchedTitleEl.closest('div[class*="job-teaser"], article, li');
      if (card) {
        description = extractStructuredDescription(card);
      }
    }


    if (isJunkTitle(title) && !description) {
      return null;
    }

    return {
      title: !isJunkTitle(title) ? title : 'Target Role',
      company: !isJunkCompany(company) ? company : 'Target Company',
      location: location || '',
      description: description || '',
      url: window.location.href,
      source: 'xing',
      extractedAt: new Date().toISOString()
    };
  }
};
