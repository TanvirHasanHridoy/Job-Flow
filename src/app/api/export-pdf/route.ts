import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { getAuthUserId } from '@/lib/auth';

export async function POST(req: Request) {
  const auth = await getAuthUserId();
  if ('error' in auth) return auth.error;

  let browser = null;
  try {
    const { html, fileName = 'Document' } = await req.json();
    if (!html) {
      return NextResponse.json({ error: 'Missing HTML content' }, { status: 400 });
    }

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load', timeout: 30000 });
    try {
      await page.evaluateHandle('document.fonts.ready');
    } catch {}

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      preferCSSPageSize: true
    });

    await browser.close();
    browser = null;

    return new Response(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName.replace(/"/g, '')}.pdf"; filename*=UTF-8''${encodeURIComponent(fileName)}.pdf`
      }
    });
  } catch (error: any) {
    if (browser) {
      try {
        await (browser as any).close();
      } catch {}
    }
    console.error('Server PDF Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate PDF document' }, { status: 500 });
  }
}
