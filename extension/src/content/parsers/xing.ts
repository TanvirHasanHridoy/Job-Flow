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

export const xingParser: JobSiteParser = {
  name: 'Xing',
  matches(url: string) {
    return /xing\.com\/jobs\//i.test(url);
  },
  parse(): ParsedJobData | null {
    // 1. Role Title
    const titleEl = document.querySelector(
      '[data-testid="job-title"], ' +
      'h1[class*="job-title"], ' +
      'h1'
    );
    const title = cleanText(titleEl?.textContent);

    // 2. Company Name
    const companyEl = document.querySelector(
      '[data-testid="company-name"], ' +
      'a[href*="/companies/"], ' +
      'div[class*="company-name"]'
    );
    const company = cleanText(companyEl?.textContent);

    // 3. Location
    const locEl = document.querySelector(
      '[data-testid="job-location"], ' +
      '[data-testid="workplace-type"], ' +
      'span[class*="location"]'
    );
    const location = cleanText(locEl?.textContent);

    // 4. Description
    const descEl = document.querySelector(
      '[data-testid="job-description"], ' +
      'article[class*="job-description"], ' +
      'article, ' +
      'div[class*="job-description"]'
    );
    const description = extractStructuredDescription(descEl);

    if (!title && !description) {
      return null;
    }

    return {
      title: title || 'Job Posting',
      company: company || 'Company',
      location: location || '',
      description: description || '',
      url: window.location.href,
      source: 'xing',
      extractedAt: new Date().toISOString()
    };
  }
};
