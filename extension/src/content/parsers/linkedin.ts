import { JobSiteParser, ParsedJobData } from './types';

function cleanText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

const JUNK_TITLE_PATTERNS = [
  /^\s*\d+[\d,]*\+?.*jobs\b/i,
  /\b\d+[\d,]*\+?\s+jobs\b/i,
  /\b(jobs|stellen|results|ergebnisse|treffer)\s+(in|found|gefunden)\b/i,
  /respects your privacy/i,
  /sign in/i,
  /join or/i,
  /notifications/i,
  /messaging/i,
  /recommended/i,
  /^jobs\b/i,
  /^search\b/i,
  /^linkedin$/i,
  /job alerts/i,
  /manage alerts/i
];

function isJunkTitle(title: string): boolean {
  if (!title || title.length < 3) return true;
  return JUNK_TITLE_PATTERNS.some(pattern => pattern.test(title));
}

function isJunkCompany(company: string): boolean {
  if (!company || company.length < 2) return true;
  const lower = company.toLowerCase().trim();
  return lower === 'linkedin' || lower.includes('privacy') || lower.includes('sign in');
}

function extractStructuredDescription(container: Element | null): string {
  if (!container) return '';
  const clone = container.cloneNode(true) as HTMLElement;

  clone.querySelectorAll('button, svg, script, style, .artdeco-button, .jobs-description__footer, nav, header').forEach(el => el.remove());

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

export const linkedinParser: JobSiteParser = {
  name: 'LinkedIn Jobs',
  matches(url: string) {
    return /linkedin\.com\/jobs/i.test(url);
  },
  parse(): ParsedJobData | null {
    // 1. Role Title Candidates (checked in priority order)
    let title = '';
    const titleCandidates = document.querySelectorAll(
      '.job-details-jobs-unified-top-card__job-title, ' +
      '.jobs-unified-top-card__job-title, ' +
      'h1.top-card-layout__title, ' +
      'h2.top-card-layout__title, ' +
      '.topcard__title, ' +
      'h1.t-24, ' +
      '.jobs-search-results-list__list-item--active .job-card-list__title, ' +
      '.jobs-search-results-list__list-item--active .job-card-container__link, ' +
      'ul.jobs-search__results-list li:first-child .base-search-card__title, ' +
      '.base-search-card__title, ' +
      '.job-card-list__title'
    );
    for (const el of titleCandidates) {
      const txt = cleanText(el.textContent);
      if (!isJunkTitle(txt)) {
        title = txt;
        break;
      }
    }

    // 2. Company Candidates (checked in priority order)
    let company = '';
    const companyCandidates = document.querySelectorAll(
      '.job-details-jobs-unified-top-card__company-name, ' +
      '.jobs-unified-top-card__company-name, ' +
      'a.topcard__org-name-link, ' +
      '.topcard__flavor--black-link, ' +
      '[data-tracking-control-name="public_jobs_topcard-org-name"], ' +
      '.jobs-search-results-list__list-item--active .job-card-container__primary-description, ' +
      '.jobs-search-results-list__list-item--active .artdeco-entity-lockup__subtitle, ' +
      'ul.jobs-search__results-list li:first-child .base-search-card__subtitle, ' +
      '.base-search-card__subtitle, ' +
      'a[data-tracking-control-name*="company"], ' +
      'a[href*="/company/"]'
    );
    for (const el of companyCandidates) {
      const txt = cleanText(el.textContent);
      if (!isJunkCompany(txt)) {
        company = txt;
        break;
      }
    }

    // 3. Location
    let location = '';
    const locCandidates = document.querySelectorAll(
      '.job-details-jobs-unified-top-card__primary-description-container, ' +
      '.topcard__flavor--bullet, ' +
      '.topcard__flavor:not(.topcard__flavor--black-link), ' +
      '.job-details-jobs-unified-top-card__workplace-type, ' +
      'ul.jobs-search__results-list li:first-child .job-search-card__location, ' +
      '.job-search-card__location'
    );

    for (const el of locCandidates) {
      const txt = cleanText(el.textContent).replace(/^[·•\s]+/, '').trim();
      if (txt && txt !== company && !txt.toLowerCase().includes('sign in')) {
        location = txt;
        break;
      }
    }

    // 4. Description
    const descEl = document.querySelector(
      '.show-more-less-html__markup, ' +
      '#job-details, ' +
      '.jobs-description__content, ' +
      '.jobs-box__html-content, ' +
      'article'
    );
    const description = extractStructuredDescription(descEl);

    // 5. Salary
    const salaryEl = document.querySelector(
      '.job-details-jobs-unified-top-card__job-insight:has(svg), ' +
      '.compensation__salary'
    );
    const salary = salaryEl && /[$€£]|\b(yr|hr|month|year|annum)\b/i.test(salaryEl.textContent || '')
      ? cleanText(salaryEl.textContent)
      : undefined;

    if (isJunkTitle(title) && !description) {
      return null;
    }

    return {
      title: !isJunkTitle(title) ? title : 'Target Role',
      company: !isJunkCompany(company) ? company : 'Target Company',
      location: location || '',
      description: description || '',
      salary,
      url: window.location.href,
      source: 'linkedin',
      extractedAt: new Date().toISOString()
    };
  }
};
