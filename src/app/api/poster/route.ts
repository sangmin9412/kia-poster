export const runtime = 'nodejs';

import puppeteer from 'puppeteer';

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => ({}));
    const text = typeof payload?.text === 'string' ? payload.text : undefined;
    const searchParams = new URLSearchParams();
    searchParams.set('text', text ?? '');
    // 2) Log the received text value
    console.log('[POST /api/poster] text:', text);

    // 3) Launch browser, navigate to /poster, screenshot, close, return base64
    const origin = new URL(request.url).origin;

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });
      await page.goto(`${origin}/poster?${searchParams.toString()}`, { waitUntil: 'networkidle0' });
      const base64 = (await page.screenshot({ type: 'png', encoding: 'base64' })) as string;
      return new Response(JSON.stringify({ imageBase64: base64 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('[POST /api/poster] error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate poster screenshot' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

