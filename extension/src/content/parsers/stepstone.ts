import { JobSiteParser, ParsedJobData } from './types';

function cleanText(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

function extractStructuredDescription(container: Element | null): string {
  if (!container) return '';
  const clone = container.cloneNode(true) as HTMLElement;

  clone.querySelectorAll('button, svg, script, style, nav, aside').forEach(el => el.remove());

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

export const stepstoneParser: JobSiteParser = {
  name: 'StepStone',
  matches(url: string) {
    return /stepstone\.(de|at|com|be|nl|co\.uk|fr)/i.test(url);
  },
  parse(): ParsedJobData | null {
    // 1. Role Title
    const titleEl = document.querySelector(
      'h1[data-genesis-element="BASE"], ' +
      '[data-testid="job-title"], ' +
      'h1.reb-job-title, ' +
      'h1.listing-header-title, ' +
      'h1'
    );
    const title = cleanText(titleEl?.textContent);

    // 2. Company Name
    const companyEl = document.querySelector(
      '[data-testid="company-name"], ' +
      '[data-at="job-item-company-name"], ' +
      'span[data-at*="company"], ' +
      'a[data-genesis-element="ANCHOR"][href*="/cmp/"], ' +
      '.listing-header-company, ' +
      '.at-listing-company-name'
    );
    const company = cleanText(companyEl?.textContent);

    // 3. Location
    const locationEl = document.querySelector(
      '[data-testid="job-location"], ' +
      '[data-at="job-item-location"], ' +
      'span[data-at*="location"], ' +
      '.listing-header-location, ' +
      'span[data-genesis-element="TEXT"]'
    );
    const location = cleanText(locationEl?.textContent);

    // 4. Description
    const descEl = document.querySelector(
      '[data-testid="job-description"], ' +
      'article[data-genesis-element="CARD"], ' +
      '.js-app-ld-json, ' +
      '.listing-content, ' +
      'article'
    );
    const description = extractStructuredDescription(descEl);

    // 5. Salary
    const salaryEl = document.querySelector('[data-testid="salary-estimate"], [data-testid="job-salary"]');
    const salary = salaryEl ? cleanText(salaryEl.textContent) : undefined;

    if (!title && !description) {
      return null;
    }

    return {
      title: title || 'Job Posting',
      company: company || 'Company',
      location: location || '',
      description: description || '',
      salary,
      url: window.location.href,
      source: 'stepstone',
      extractedAt: new Date().toISOString()
    };
  }
};
