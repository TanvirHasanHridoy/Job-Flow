import { JobSiteParser, ParsedJobData } from './types';

function cleanText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

const NOISE_TITLES = ['linkedin', 'jobs', 'feed', 'notifications', 'messaging', 'search', 'home'];
const NOISE_COMPANIES = ['linkedin'];

function isNoiseTitle(title: string): boolean {
  const lower = title.toLowerCase().trim();
  return lower.length < 3 || NOISE_TITLES.includes(lower);
}

function isNoiseCompany(company: string): boolean {
  const lower = company.toLowerCase().trim();
  return lower.length < 2 || NOISE_COMPANIES.includes(lower);
}

function extractStructuredDescription(container: Element | null): string {
  if (!container) return '';
  const clone = container.cloneNode(true) as HTMLElement;

  clone.querySelectorAll('button, svg, script, style, .artdeco-button, .jobs-description__footer').forEach(el => el.remove());

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
    // 1. Locate the Active Detail Container (crucial for split-screen search view)
    const detailContainer = document.querySelector(
      '.jobs-search__job-details--container, ' +
      '.jobs-details__main-content, ' +
      '.scaffold-layout__detail, ' +
      'div.job-view-layout, ' +
      '[data-job-id], ' +
      'main.scaffold-layout__main'
    ) || document;

    // 2. Role Title (scoped to detail container first, active card fallback)
    let title = '';
    const titleEl = detailContainer.querySelector(
      '.job-details-jobs-unified-top-card__job-title, ' +
      '.jobs-unified-top-card__job-title, ' +
      'h1.t-24, ' +
      '.top-card-layout__title, ' +
      'h1.job-details-jobs-unified-top-card__job-title, ' +
      'h1'
    );
    title = cleanText(titleEl?.textContent);

    // Fallback to active card in the left list if detail title is noise
    if (isNoiseTitle(title)) {
      const activeCardTitleEl = document.querySelector(
        '.jobs-search-results-list__list-item--active .job-card-list__title, ' +
        '.jobs-search-results-list__list-item--active a.job-card-container__link, ' +
        'li.active .job-card-list__title, ' +
        '[data-occludable-job-id].active a'
      );
      title = cleanText(activeCardTitleEl?.textContent);
    }

    // 3. Company Name (scoped to detail container first)
    let company = '';
    const companyEl = detailContainer.querySelector(
      '.job-details-jobs-unified-top-card__company-name, ' +
      '.jobs-unified-top-card__company-name, ' +
      '.topcard__flavor--black-link, ' +
      'a.topcard__org-name-link, ' +
      '.jobs-unified-top-card__subtitle-primary-grouping a, ' +
      'a[href*="/company/"]'
    );
    company = cleanText(companyEl?.textContent);

    // Fallback to active card in the left list
    if (isNoiseCompany(company)) {
      const activeCardCompanyEl = document.querySelector(
        '.jobs-search-results-list__list-item--active .artdeco-entity-lockup__subtitle, ' +
        '.jobs-search-results-list__list-item--active .job-card-container__primary-description'
      );
      company = cleanText(activeCardCompanyEl?.textContent);
    }

    // 4. Location & Workplace Type
    const locEl = detailContainer.querySelector(
      '.job-details-jobs-unified-top-card__primary-description-container, ' +
      '.jobs-unified-top-card__bullet, ' +
      '.topcard__flavor--bullet, ' +
      '.job-details-jobs-unified-top-card__workplace-type'
    );
    let location = cleanText(locEl?.textContent).replace(/^[·•\s]+/, '').trim();

    // 5. Job Description (scoped strictly to detail container)
    const descEl = detailContainer.querySelector(
      '#job-details, ' +
      '.jobs-description__content, ' +
      '.jobs-description-content__text, ' +
      '.jobs-box__html-content, ' +
      '.show-more-less-html__markup, ' +
      '.description__text, ' +
      'article'
    );
    const description = extractStructuredDescription(descEl);

    // 6. Salary / Compensation
    const salaryEl = detailContainer.querySelector(
      '.job-details-jobs-unified-top-card__job-insight:has(svg), ' +
      '.compensation__salary'
    );
    const salary = salaryEl && /[$€£]|\b(yr|hr|month|year|annum)\b/i.test(salaryEl.textContent || '')
      ? cleanText(salaryEl.textContent)
      : undefined;

    // Reject if noise or empty
    if (isNoiseTitle(title) && !description) {
      return null;
    }

    return {
      title: !isNoiseTitle(title) ? title : 'Target Role',
      company: !isNoiseCompany(company) ? company : 'Target Company',
      location: location || '',
      description: description || '',
      salary,
      url: window.location.href,
      source: 'linkedin',
      extractedAt: new Date().toISOString()
    };
  }
};
