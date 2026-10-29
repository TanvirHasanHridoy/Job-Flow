import { JobSiteParser, ParsedJobData } from './types';

function cleanText(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

function extractStructuredDescription(container: Element | null): string {
  if (!container) return '';
  const clone = container.cloneNode(true) as HTMLElement;

  clone.querySelectorAll('button, svg, script, style, nav').forEach(el => el.remove());

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

export const indeedParser: JobSiteParser = {
  name: 'Indeed',
  matches(url: string) {
    return /indeed\.(com|de|co\.uk|fr|ca|nl)/i.test(url);
  },
  parse(): ParsedJobData | null {
    // 1. Role Title
    const titleEl = document.querySelector(
      '[data-testid="jobsearch-JobInfoHeader-title"], ' +
      '.jobsearch-JobInfoHeader-title, ' +
      'h1.jobsearch-JobInfoHeader-title'
    );
    const title = cleanText(titleEl?.textContent);

    // 2. Company Name
    const companyEl = document.querySelector(
      '[data-testid="inlineHeader-companyName"], ' +
      '[data-company-name="true"], ' +
      '.jobsearch-InlineCompanyRating-companyHeader'
    );
    const company = cleanText(companyEl?.textContent);

    // 3. Location
    const locEl = document.querySelector(
      '[data-testid="inlineHeader-companyLocation"], ' +
      '[data-testid="job-location"], ' +
      '.jobsearch-JobInfoHeader-companyLocation'
    );
    const location = cleanText(locEl?.textContent);

    // 4. Job Description
    const descEl = document.querySelector(
      '#jobDescriptionText, ' +
      '.jobsearch-jobDescriptionText'
    );
    const description = extractStructuredDescription(descEl);

    // 5. Salary
    const salaryEl = document.querySelector(
      '#salaryInfoAndJobType, ' +
      '.jobsearch-JobMetadataHeader-item:has(svg)'
    );
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
      source: 'indeed',
      extractedAt: new Date().toISOString()
    };
  }
};
