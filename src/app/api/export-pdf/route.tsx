import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let browser;
  try {
    const auth = await getAuthUserId();
    if ('error' in auth) return auth.error;

    const { html } = await req.json();

    if (!html) {
      return NextResponse.json({ error: 'Missing required parameter: html' }, { status: 400 });
    }

    let puppeteerModule: any;
    let launchOptions: any = {};

    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      // In production (Vercel/serverless/AWS/Docker)
      puppeteerModule = await import('puppeteer-core');
      const chromium = (await import('@sparticuz/chromium')) as any;
      launchOptions = {
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      };
    } else {
      // In local development (Windows / standard node env)
      puppeteerModule = await import('puppeteer');
      launchOptions = {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
      };
    }

    browser = (await puppeteerModule.launch(launchOptions)) as any;

    const page = (await browser.newPage()) as any;
    
    // Set exact content
    await page.setContent(html, { waitUntil: 'networkidle0' as any });

    // Wait for web fonts to load
    await page.evaluateHandle('document.fonts.ready');

    // Generate PDF with A4 formatting
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      },
      preferCSSPageSize: true
    });

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="document.pdf"',
      },
    });
  } catch (error: any) {
    console.error('Puppeteer PDF generation error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred during PDF generation' }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
