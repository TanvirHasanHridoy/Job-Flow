import { JobSiteParser, ParsedJobData } from './types';

function cleanText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

function extractStructuredDescription(container: Element | null): string {
  if (!container) return '';
  // Clone to avoid altering the actual DOM
  const clone = container.cloneNode(true) as HTMLElement;

  // Remove buttons, links that say 'show more', hidden SVGs, dismiss elements
  clone.querySelectorAll('button, svg, script, style, .artdeco-button').forEach(el => el.remove());

  // Convert list items to clean markdown bullets
  clone.querySelectorAll('li').forEach(li => {
    li.textContent = `\n• ${li.textContent?.trim() || ''}`;
  });

  // Convert headings and paragraphs to spaced blocks
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
    return /linkedin\.com\/jobs\//i.test(url);
  },
  parse(): ParsedJobData | null {
    // 1. Role Title
    const titleEl = document.querySelector(
      '.job-details-jobs-unified-top-card__job-title, ' +
      '.jobs-unified-top-card__job-title, ' +
      'h1.t-24, ' +
      '.top-card-layout__title, ' +
      'h1.job-details-jobs-unified-top-card__job-title'
    );
    const title = cleanText(titleEl?.textContent);

    // 2. Company Name
    const companyEl = document.querySelector(
      '.job-details-jobs-unified-top-card__company-name, ' +
      '.jobs-unified-top-card__company-name, ' +
      '.topcard__flavor--black-link, ' +
      'a.topcard__org-name-link, ' +
      '.jobs-unified-top-card__subtitle-primary-grouping a'
    );
    const company = cleanText(companyEl?.textContent);

    // 3. Location & Workplace Type
    const locEl = document.querySelector(
      '.job-details-jobs-unified-top-card__primary-description-container, ' +
      '.jobs-unified-top-card__bullet, ' +
      '.topcard__flavor--bullet, ' +
      '.job-details-jobs-unified-top-card__workplace-type'
    );
    let location = cleanText(locEl?.textContent);
    // Remove bullet characters if attached
    location = location.replace(/^[·•\s]+/, '').trim();

    // 4. Job Description
    const descEl = document.querySelector(
      '#job-details, ' +
      '.jobs-description__content, ' +
      '.jobs-description-content__text, ' +
      '.show-more-less-html__markup, ' +
      '.description__text'
    );
    const description = extractStructuredDescription(descEl);

    // 5. Salary / Compensation (if shown)
    const salaryEl = document.querySelector(
      '.job-details-jobs-unified-top-card__job-insight:has(svg), ' +
      '.compensation__salary'
    );
    const salary = salaryEl && /[$€£]|\b(yr|hr|month|year|annum)\b/i.test(salaryEl.textContent || '')
      ? cleanText(salaryEl.textContent)
      : undefined;

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
      source: 'linkedin',
      extractedAt: new Date().toISOString()
    };
  }
};
