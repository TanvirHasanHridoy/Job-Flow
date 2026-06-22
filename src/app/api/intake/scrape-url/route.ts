import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { deductTokens, TOKEN_PRICING } from '@/lib/tokens';
import * as cheerio from 'cheerio';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

const BROWSER_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
];

function getRandomUserAgent() {
  return BROWSER_USER_AGENTS[Math.floor(Math.random() * BROWSER_USER_AGENTS.length)];
}

function isAntiBotProtected(text: string): boolean {
  const lowercase = text.toLowerCase();
  return (
    lowercase.includes('cloudflare') ||
    lowercase.includes('captcha') ||
    lowercase.includes('security challenge') ||
    lowercase.includes('ddos protection') ||
    lowercase.includes('checking your browser') ||
    lowercase.includes('robot check') ||
    lowercase.includes('shield check') ||
    lowercase.includes('access denied')
  );
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthUserId();
    if ('error' in auth) return auth.error;
    const { userId } = auth;

    // Deduct tokens
    const deduction = await deductTokens(userId, TOKEN_PRICING.INTAKE);
    if (!deduction.success) {
      return NextResponse.json(
        { error: 'Insufficient tokens. Please top up your account.' },
        { status: 403 }
      );
    }

    const { url } = await req.json();

    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return NextResponse.json({ error: 'Please provide a valid job posting URL.' }, { status: 400 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'DeepSeek API Key is not configured in environment variables.' },
        { status: 500 }
      );
    }

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
    let isBlocked = status === 403 || status === 429 || !html || isAntiBotProtected(html);

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

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: promptContent }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API Error during URL scrape parsing:', errorText);
      return NextResponse.json(
        { error: `DeepSeek API returned status ${response.status}: ${errorText}` },
        { status: 502 }
      );
    }

    const resJson = await response.json();
    const parsedData = JSON.parse(resJson.choices[0].message.content);

    return NextResponse.json({
      fallback: false,
      tier: tierUsed,
      ...parsedData
    });
  } catch (error: any) {
    console.error('Scrape job URL API error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred during URL scraping' }, { status: 500 });
  }
}
