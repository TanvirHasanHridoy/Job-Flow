import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { getAuthUserId } from '@/lib/auth';

// The client sends a full HTML snapshot of the rendered CV/letter. That HTML is
// untrusted, so the headless browser rendering it must not run scripts or reach
// the network (SSRF: internal services, cloud metadata, file:// paths).
const MAX_HTML_BYTES = 15 * 1024 * 1024; // embedded base64 photos/signatures can be large
const MAX_CONCURRENT_RENDERS = 2;

// Only these external hosts may be fetched while rendering (web fonts).
const ALLOWED_REMOTE_HOSTS = new Set(['fonts.googleapis.com', 'fonts.gstatic.com']);

function isAllowedRenderRequest(rawUrl: string): boolean {
  if (rawUrl.startsWith('data:') || rawUrl.startsWith('blob:') || rawUrl === 'about:blank') {
    return true;
  }
  try {
    const url = new URL(rawUrl);
    return url.protocol === 'https:' && ALLOWED_REMOTE_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

let activeRenders = 0;

export async function POST(req: Request) {
  const auth = await getAuthUserId();
  if ('error' in auth) return auth.error;

  if (activeRenders >= MAX_CONCURRENT_RENDERS) {
    return NextResponse.json(
      { error: 'The PDF service is busy. Please try again in a few seconds.' },
      { status: 503 }
    );
  }

  let browser = null;
  activeRenders++;
  try {
    const { html, fileName = 'Document' } = await req.json();
    if (!html || typeof html !== 'string') {
      return NextResponse.json({ error: 'Missing HTML content' }, { status: 400 });
    }
    if (Buffer.byteLength(html, 'utf8') > MAX_HTML_BYTES) {
      return NextResponse.json({ error: 'Document is too large to export.' }, { status: 413 });
    }

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });

    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    await page.setRequestInterception(true);
    page.on('request', request => {
      if (isAllowedRenderRequest(request.url())) {
        request.continue();
      } else {
        request.abort('blockedbyclient');
      }
    });

    // With page scripts disabled, wait for the network (web fonts) to go idle
    // instead of awaiting document.fonts.ready from inside the page.
    await page.setContent(html, { waitUntil: 'load', timeout: 30000 });
    try {
      await page.waitForNetworkIdle({ idleTime: 300, timeout: 10000 });
    } catch {}

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      preferCSSPageSize: true
    });

    await browser.close();
    browser = null;

    const safeName = String(fileName).replace(/["\r\n]/g, '');
    return new Response(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeName}.pdf"; filename*=UTF-8''${encodeURIComponent(safeName)}.pdf`
      }
    });
  } catch (error: any) {
    console.error('Server PDF Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF document' }, { status: 500 });
  } finally {
    activeRenders--;
    if (browser) {
      try {
        await (browser as any).close();
      } catch {}
    }
  }
}
