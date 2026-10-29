import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { deductTokens, topUpTokens, TOKEN_PRICING } from '@/lib/tokens';
import { getAiConfig } from '@/lib/ai';
import * as cheerio from 'cheerio';

// === DeepSeek API Configuration (Preserved / Commented as requested) ===
// const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

const BROWSER_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
];

function getRandomUserAgent() {
  return BROWSER_USER_AGENTS[Math.floor(Math.random() * BROWSER_USER_AGENTS.length)];
}

function isAntiBotProtected(html: string): boolean {
  // Only inspect the title and visible text. Scanning raw markup produces
  // false positives because most normal pages reference "captcha"/"cloudflare"
  // somewhere in their scripts or third-party embeds.
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');

  const title = (withoutScripts.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').toLowerCase();
  const visibleText = withoutScripts
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .slice(0, 4000);

  const challengeMarkers = [
    'just a moment...',
    'attention required! | cloudflare',
    'enable javascript and cookies to continue',
    'checking your browser before accessing',
    'please verify you are a human',
    'verify you are human',
    'are you a robot',
    'cf-browser-verification',
    'ddos protection by'
  ];

  return challengeMarkers.some(marker => title.includes(marker) || visibleText.includes(marker));
}

export async function POST(req: Request) {
  let userId: string | null = null;
  let tokensDeducted = false;
  let refunded = false;

  const refundTokens = async () => {
    if (!tokensDeducted || refunded || !userId) return;
    refunded = true;
    try {
      await topUpTokens(userId, TOKEN_PRICING.INTAKE);
    } catch (refundErr) {
      console.error('Failed to refund scrape tokens:', refundErr);
    }
  };

  try {
    const auth = await getAuthUserId();
    if ('error' in auth) return auth.error;
    userId = auth.userId;

    const { url } = await req.json();

    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return NextResponse.json({ error: 'Please provide a valid job posting URL.' }, { status: 400 });
    }

    // Deduct tokens only after the request has been validated
    const deduction = await deductTokens(userId, TOKEN_PRICING.INTAKE);
    if (!deduction.success) {
      return NextResponse.json(
        { error: 'Insufficient tokens. Please top up your account.' },
        { status: 403 }
      );
    }
    tokensDeducted = true;

    const aiConfig = getAiConfig();
    if (!aiConfig.apiKey) {
      await refundTokens();
      return NextResponse.json(
        { error: `${aiConfig.provider} API Key is not configured in environment variables.` },
        { status: 500 }
      );
    }

    // === DEEPSEEK API KEY (Preserved / Commented as requested) ===
    // const apiKey = process.env.DEEPSEEK_API_KEY;
    // if (!apiKey) {
    //   return NextResponse.json(
    //     { error: 'DeepSeek API Key is not configured in environment variables.' },
    //     { status: 500 }
    //   );
    // }

    let html = '';
    let status = 200;
    let tierUsed = 'Tier 1 (Direct)';

    // --- TIER 1: Direct Fetch with rotating User-Agent ---
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Referer': 'https://www.google.com/'
        },
        next: { revalidate: 0 }
      });
      status = response.status;
      html = await response.text();
    } catch (err: any) {
      console.warn('Tier 1 scrape failed, preparing fallback:', err.message || err);
      status = 500;
    }

    // Parse text and check for anti-bot
    let isBlocked = status >= 400 || !html || isAntiBotProtected(html);

    // --- TIER 2: Proxy Fallback / Scraper Service ---
    if (isBlocked) {
      console.log('Tier 1 direct fetch blocked or failed. Attempting Tier 2 proxy fallback...');
      tierUsed = 'Tier 2 (Proxy)';
      
      const scraperApiKey = process.env.SCRAPER_API_KEY || process.env.ZENROWS_API_KEY;
      if (scraperApiKey) {
        try {
          // Construct scraper service endpoint
          let targetScrapeUrl = '';
          if (process.env.SCRAPER_API_KEY) {
            targetScrapeUrl = `http://api.scraperapi.com?api_key=${process.env.SCRAPER_API_KEY}&url=${encodeURIComponent(url)}`;
          } else {
            targetScrapeUrl = `https://api.zenrows.com/v1/?apikey=${process.env.ZENROWS_API_KEY}&url=${encodeURIComponent(url)}&premium_proxy=true`;
          }

          const response = await fetch(targetScrapeUrl, { next: { revalidate: 0 } });
          if (response.ok) {
            html = await response.text();
            isBlocked = isAntiBotProtected(html);
          }
        } catch (proxyErr: any) {
          console.error('Tier 2 proxy service error:', proxyErr.message || proxyErr);
        }
      } else {
        console.log('No premium proxy scraper credentials found in environment. Simulating proxy check...');
        // Without active keys, we cannot bypass Cloudflare in code. Let it cascade to Tier 3.
      }
    }

    // --- TIER 3: Fallback Notice ---
    if (isBlocked || !html.trim()) {
      await refundTokens();
      return NextResponse.json({
        fallback: true,
        message: 'Anti-bot security (like Cloudflare or CAPTCHA) blocked automated extraction for this site. Please copy-paste the text of the job description directly into the workspace.'
      });
    }

    // --- HTML Parsing via Cheerio ---
    const $ = cheerio.load(html);
    
    // Strip unnecessary markup tags
    $('script, style, noscript, iframe, svg, header, footer, nav, aside').remove();
    
    // Retrieve clean text layer
    const rawText = $('body').text().replace(/\s+/g, ' ').trim();

    if (rawText.length < 100) {
      await refundTokens();
      return NextResponse.json({
        fallback: true,
        message: 'Extracted content seems too short or empty. Please copy-paste the job description text manually.'
      });
    }

    // --- DeepSeek Clean & Structuring Prompt ---
    const systemPrompt = `You are a professional recruiting intake analyzer. Your task is to process raw scraped text from a job posting web page and extract:
1. Job Title / Role Name (e.g. "Senior React Developer")
2. Company Name (e.g. "Acme Corp")
3. Clean Job Description (Keep responsibilities, requirements, technical skills, benefits. Strip navigation, cookies, cookie banners, SEO keywords, unrelated job listings, ads).

Return a strict JSON object conforming to this template:
{
  "roleName": "<string>",
  "companyName": "<string>",
  "jobDescription": "<string, markdown formatted requirements & job details>"
}`;

    const promptContent = `Here is the raw text scraped from the job page:
--- SCRAPED TEXT ---
${rawText}

Please parse and return the JSON object.`;

    // === DEEPSEEK Scrape Parse Fetch (Commented) ===
    // const response = await fetch(DEEPSEEK_API_URL, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    //   body: JSON.stringify({
    //     model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-pro',
    //     messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: promptContent }],
    //     response_format: { type: 'json_object' },
    //     temperature: 0.1
    //   })
    // });

    // Retry transient rate limits / upstream outages before giving up.
    let response: Response | null = null;
    let lastError: Error | null = null;
    const maxRetries = 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = attempt === 1 ? 1200 : 2500;
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        response = await fetch(aiConfig.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${aiConfig.apiKey}`
          },
          body: JSON.stringify({
            model: aiConfig.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: promptContent }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1
          }),
          signal: AbortSignal.timeout(90000)
        });

        if (response.ok) {
          lastError = null;
          break;
        }

        const isRetryable = response.status === 429 || response.status === 500 || response.status === 502 || response.status === 503 || response.status === 504;
        if (!isRetryable) break;
      } catch (err: any) {
        lastError = err;
        if (attempt === maxRetries) break;
      }
    }

    if (!response || !response.ok) {
      await refundTokens();

      if (!response) {
        const message = lastError?.message || 'Failed to communicate with AI model';
        console.error(`${aiConfig.provider} API request failed during URL scrape parsing:`, message);
        return NextResponse.json({ error: message }, { status: 502 });
      }

      const errorText = await response.text().catch(() => '');
      console.error(`${aiConfig.provider} API Error during URL scrape parsing:`, errorText);
      return NextResponse.json(
        { error: `${aiConfig.provider} API returned status ${response.status}: ${errorText}` },
        { status: 502 }
      );
    }

    let parsedData: any;
    try {
      const resJson = await response.json();
      const content = resJson.choices?.[0]?.message?.content || '';
      if (!content.trim()) throw new Error('AI returned an empty response');
      parsedData = JSON.parse(content);
    } catch (parseErr: any) {
      await refundTokens();
      console.error('Failed to parse scrape AI output:', parseErr);
      return NextResponse.json({ error: 'AI produced invalid JSON output. Please retry.' }, { status: 502 });
    }

    return NextResponse.json({
      fallback: false,
      tier: tierUsed,
      ...parsedData
    });
  } catch (error: any) {
    await refundTokens();
    console.error('Scrape job URL API error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred during URL scraping' }, { status: 500 });
  }
}
