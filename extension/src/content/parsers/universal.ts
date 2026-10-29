import { JobSiteParser, ParsedJobData } from './types';

function cleanText(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

const NOISE_TITLES = [
  'jobsuche',
  'jobs',
  'search',
  'search results',
  'careers',
  'karriere',
  'stellenangebote',
  'xing',
  'linkedin',
  'indeed',
  'stepstone',
  'empfehlungen'
];

const NOISE_COMPANIES = [
  'xing',
  'xing jobs',
  'linkedin',
  'indeed',
  'stepstone',
  'glassdoor',
  'new work se'
];

function isNoiseTitle(title: string): boolean {
  const lower = title.toLowerCase().trim();
  if (lower.length < 3) return true;
  return NOISE_TITLES.some(noise => lower === noise || lower.startsWith(noise + ' '));
}

function isNoiseCompany(company: string): boolean {
  const lower = company.toLowerCase().trim();
  if (lower.length < 2) return true;
  return NOISE_COMPANIES.some(noise => lower === noise);
}

function htmlToPlainText(html: string): string {
  const temp = document.createElement('div');
  temp.innerHTML = html;

  temp.querySelectorAll('script, style, svg, button, nav, header, footer').forEach(el => el.remove());
  temp.querySelectorAll('li').forEach(li => {
    li.textContent = `\n• ${li.textContent?.trim() || ''}`;
  });
  temp.querySelectorAll('h1, h2, h3, h4, h5, h6, p').forEach(p => {
    p.textContent = `\n${p.textContent?.trim() || ''}\n`;
  });

  return (temp.innerText || temp.textContent || '')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .join('\n');
}

/**
 * Attempt to extract Schema.org/JobPosting from <script type="application/ld+json">
 */
function extractSchemaOrgJob(): ParsedJobData | null {
  try {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (let i = 0; i < scripts.length; i++) {
      const content = scripts[i].textContent;
      if (!content) continue;
      
      let parsed: any;
      try {
        parsed = JSON.parse(content);
      } catch {
        continue;
      }

      const items: any[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.['@graph'])
          ? parsed['@graph']
          : [parsed];

      for (const item of items) {
        const type = item?.['@type'];
        if (type === 'JobPosting' || (Array.isArray(type) && type.includes('JobPosting'))) {
          const title = cleanText(item.title);
          const rawCompany = typeof item.hiringOrganization === 'string'
            ? item.hiringOrganization
            : item.hiringOrganization?.name || '';
          const company = cleanText(rawCompany);

          if (isNoiseTitle(title)) {
            continue;
          }

          let location = '';
          if (item.jobLocation) {
            const addr = item.jobLocation.address;
            if (typeof addr === 'string') {
              location = addr;
            } else if (addr && typeof addr === 'object') {
              location = [addr.addressLocality, addr.addressRegion, addr.addressCountry]
                .filter(Boolean)
                .join(', ');
            }
          }

          let description = '';
          if (typeof item.description === 'string') {
            description = htmlToPlainText(item.description);
          }

          if (title && description && description.length > 60) {
            return {
              title,
              company: !isNoiseCompany(company) ? company : 'Target Company',
              location,
              description,
              url: window.location.href,
              source: 'schema',
              extractedAt: new Date().toISOString()
            };
          }
        }
      }
    }
  } catch (err) {
    console.warn('[JobFlow] Schema extraction error:', err);
  }
  return null;
}

/**
 * Universal heuristic readability parser as ultimate fallback
 */
function extractHeuristicJob(): ParsedJobData | null {
  // Title: check h1/h2 inside article or main first
  let title = '';
  const candidateHeadings = document.querySelectorAll('article h1, main h1, [role="main"] h1, h1, h2');
  for (let i = 0; i < candidateHeadings.length; i++) {
    const text = cleanText(candidateHeadings[i].textContent);
    if (text && !isNoiseTitle(text)) {
      title = text;
      break;
    }
  }

  // Company: meta tags or author
  const metaAuthor = document.querySelector('meta[name="author"], meta[property="business:contact_data:locality"]')?.getAttribute('content');
  let company = cleanText(metaAuthor || '');
  if (isNoiseCompany(company)) company = '';

  // Look for the largest text container in main or article
  const containers = document.querySelectorAll('article, main, [role="main"], div[class*="job"], div[class*="description"]');
  let bestContainer: Element | null = null;
  let maxScore = 0;

  const keywords = ['requirements', 'responsibilities', 'qualifications', 'experience', 'skills', 'about us', 'what you bring', 'aufgaben', 'profil'];

  containers.forEach(container => {
    const text = (container.textContent || '').toLowerCase();
    if (text.length < 300) return;

    let score = text.length;
    keywords.forEach(kw => {
      if (text.includes(kw)) score += 500;
    });

    if (score > maxScore) {
      maxScore = score;
      bestContainer = container;
    }
  });

  if (!bestContainer && document.body) {
    bestContainer = document.body;
  }

  if (bestContainer) {
    const clone = bestContainer.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('header, footer, nav, aside, button, script, style, svg').forEach(el => el.remove());
    clone.querySelectorAll('li').forEach(li => {
      li.textContent = `\n• ${li.textContent?.trim() || ''}`;
    });
    clone.querySelectorAll('h1, h2, h3, h4, h5, h6, p').forEach(p => {
      p.textContent = `\n${p.textContent?.trim() || ''}\n`;
    });

    const description = (clone.innerText || clone.textContent || '')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0)
      .join('\n');

    if (description.length > 150) {
      return {
        title: title || 'Target Role',
        company: company || 'Target Company',
        location: '',
        description,
        url: window.location.href,
        source: 'universal',
        extractedAt: new Date().toISOString()
      };
    }
  }

  return null;
}

export const universalParser: JobSiteParser = {
  name: 'Universal Parser',
  matches() {
    return true;
  },
  parse(): ParsedJobData | null {
    const schemaJob = extractSchemaOrgJob();
    if (schemaJob) return schemaJob;
    return extractHeuristicJob();
  }
};
