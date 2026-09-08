import { JobSiteParser, ParsedJobData } from './types';

function cleanText(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

const NOISE_TITLES = [
  'jobsuche',
  'jobs',
  'finde deinen job',
  'dein nächster karriereschritt',
  'empfehlungen',
  'xing',
  'xing jobs',
  'suche',
  'meine jobs',
  'gespeicherte jobs'
];

const NOISE_COMPANIES = ['xing', 'xing jobs', 'new work se', 'kununu'];

function isNoiseTitle(title: string): boolean {
  const lower = title.toLowerCase().trim();
  if (lower.length < 3) return true;
  return NOISE_TITLES.some(noise => lower.includes(noise));
}

function isNoiseCompany(company: string): boolean {
  const lower = company.toLowerCase().trim();
  if (lower.length < 2) return true;
  return NOISE_COMPANIES.some(noise => lower === noise);
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

/**
 * Check for Schema.org JobPosting embedded by Xing
 */
function extractXingJsonLd(): { title?: string; company?: string; location?: string; description?: string } | null {
  try {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (let i = 0; i < scripts.length; i++) {
      const text = scripts[i].textContent;
      if (!text) continue;
      const parsed = JSON.parse(text);
      const items = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.['@graph']) ? parsed['@graph'] : [parsed];
      for (const item of items) {
        if (item?.['@type'] === 'JobPosting') {
          const t = cleanText(item.title);
          const c = cleanText(typeof item.hiringOrganization === 'string' ? item.hiringOrganization : item.hiringOrganization?.name);
          if (!isNoiseTitle(t)) {
            return {
              title: t,
              company: !isNoiseCompany(c) ? c : undefined,
              location: cleanText(item.jobLocation?.address?.addressLocality),
              description: typeof item.description === 'string' ? item.description.replace(/<[^>]+>/g, ' ').trim() : undefined
            };
          }
        }
      }
    }
  } catch {
    // Ignore JSON-LD parse errors
  }
  return null;
}

export const xingParser: JobSiteParser = {
  name: 'Xing',
  matches(url: string) {
    return /xing\.com\/jobs/i.test(url);
  },
  parse(): ParsedJobData | null {
    // 1. Try embedded JSON-LD first for maximum accuracy
    const jsonLd = extractXingJsonLd();

    // 2. Identify detail container (right-hand panel or main article)
    const detailContainer = document.querySelector(
      '[data-testid="job-details"], ' +
      '[data-testid="job-preview"], ' +
      'article[data-testid*="job"], ' +
      'main [data-testid="job-details"], ' +
      'section[data-testid*="detail"], ' +
      'main'
    ) || document;

    // 3. Extract Role Title (strictly filtered for noise like 'Jobsuche')
    let title = jsonLd?.title || '';
    if (!title || isNoiseTitle(title)) {
      const candidateElements = detailContainer.querySelectorAll(
        '[data-testid="job-title"], ' +
        '[data-testid="headline"], ' +
        'h1[class*="job-title"], ' +
        'h2[data-testid="job-title"], ' +
        'h1, h2'
      );
      for (let i = 0; i < candidateElements.length; i++) {
        const text = cleanText(candidateElements[i].textContent);
        if (text && !isNoiseTitle(text)) {
          title = text;
          break;
        }
      }
    }

    // 4. Extract Company Name
    let company = jsonLd?.company || '';
    if (!company || isNoiseCompany(company)) {
      const candidateCompany = detailContainer.querySelector(
        '[data-testid="company-name"], ' +
        'a[href*="/companies/"], ' +
        'a[href*="/company/"], ' +
        '[data-testid="sub-title"], ' +
        'span[class*="company-name"], ' +
        'div[class*="company-name"]'
      );
      const text = cleanText(candidateCompany?.textContent);
      if (text && !isNoiseCompany(text)) {
        company = text;
      }
    }

    // 5. Extract Location
    let location = jsonLd?.location || '';
    if (!location) {
      const candidateLoc = detailContainer.querySelector(
        '[data-testid="job-location"], ' +
        '[data-testid="location"], ' +
        '[data-testid="workplace-type"], ' +
        'span[class*="location"]'
      );
      location = cleanText(candidateLoc?.textContent);
    }

    // 6. Extract Description
    let description = '';
    const descEl = detailContainer.querySelector(
      '[data-testid="job-description"], ' +
      '[data-testid="description-content"], ' +
      'article[class*="job-description"], ' +
      'div[class*="job-description"], ' +
      'section[class*="description"], ' +
      'article'
    );
    description = extractStructuredDescription(descEl) || jsonLd?.description || '';

    // If title is noise and no description, return null
    if (isNoiseTitle(title) && !description) {
      return null;
    }

    return {
      title: !isNoiseTitle(title) ? title : 'Target Role',
      company: !isNoiseCompany(company) ? company : 'Target Company',
      location: location || '',
      description: description || '',
      url: window.location.href,
      source: 'xing',
      extractedAt: new Date().toISOString()
    };
  }
};
