import { JobSiteParser, ParsedJobData } from './types';

function cleanText(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

function htmlToPlainText(html: string): string {
  const temp = document.createElement('div');
  temp.innerHTML = html;

  temp.querySelectorAll('script, style, svg, button, nav').forEach(el => el.remove());
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

      // Handle arrays or @graph collections
      const items: any[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.['@graph'])
          ? parsed['@graph']
          : [parsed];

      for (const item of items) {
        const type = item?.['@type'];
        if (type === 'JobPosting' || (Array.isArray(type) && type.includes('JobPosting'))) {
          const title = cleanText(item.title);
          const company = cleanText(
            typeof item.hiringOrganization === 'string'
              ? item.hiringOrganization
              : item.hiringOrganization?.name || ''
          );

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

          if (title && description) {
            return {
              title,
              company: company || 'Company',
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
  // Title: usually the first main h1
  const h1 = document.querySelector('main h1, article h1, [role="main"] h1, h1');
  const title = cleanText(h1?.textContent);

  // Company: meta tags or site name
  const metaSite = document.querySelector('meta[property="og:site_name"]')?.getAttribute('content');
  const metaCompany = document.querySelector('meta[name="author"], meta[property="business:contact_data:locality"]')?.getAttribute('content');
  const company = cleanText(metaCompany || metaSite || '');

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
        title: title || 'Job Posting',
        company: company || 'Company',
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
    // 1. Try Schema.org first (highest fidelity structured data)
    const schemaJob = extractSchemaOrgJob();
    if (schemaJob) return schemaJob;

    // 2. Fall back to heuristic DOM readability
    return extractHeuristicJob();
  }
};
