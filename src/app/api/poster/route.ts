export const runtime = 'nodejs';
export const maxDuration = 30; // Vercel 함수 타임아웃 설정 (초)

import chromium from '@sparticuz/chromium';

// Chromium 설정 최적화
chromium.setHeadlessMode = true;
chromium.setGraphicsMode = false;

export async function POST(request: Request) {
  let browser = null;
  
  try {
    const payload = await request.json().catch(() => ({}));
    const text = typeof payload?.text === 'string' ? payload.text : undefined;
    const searchParams = new URLSearchParams();
    searchParams.set('text', text ?? '');
    // 2) Log the received text value
    console.log('[POST /api/poster] text:', text);
    console.log('[POST /api/poster] Environment:', process.env.NODE_ENV);
    console.log('[POST /api/poster] Vercel:', process.env.VERCEL);

    // 3) Launch browser, navigate to /poster, screenshot, close, return base64
    const origin = new URL(request.url).origin;

    // Vercel 환경과 로컬 환경 구분
    const isProduction = process.env.NODE_ENV === 'production';
    const isVercel = process.env.VERCEL === '1';
    
    console.log('[POST /api/poster] isProduction:', isProduction, 'isVercel:', isVercel);
    
    // Vercel 환경에서 추가 args 설정
    const chromiumArgs = [
      '--autoplay-policy=user-gesture-required',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad',
      '--disable-client-side-phishing-detection',
      '--disable-component-extensions-with-background-pages',
      '--disable-default-apps',
      '--disable-dev-shm-usage',
      '--disable-extensions',
      '--disable-features=TranslateUI',
      '--disable-hang-monitor',
      '--disable-ipc-flooding-protection',
      '--disable-notifications',
      '--disable-offer-store-unmasked-wallet-cards',
      '--disable-popup-blocking',
      '--disable-print-preview',
      '--disable-prompt-on-repost',
      '--disable-renderer-backgrounding',
      '--disable-setuid-sandbox',
      '--disable-speech-api',
      '--disable-sync',
      '--hide-scrollbars',
      '--ignore-gpu-blacklist',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-default-browser-check',
      '--no-first-run',
      '--no-pings',
      '--no-sandbox',
      '--no-zygote',
      '--password-store=basic',
      '--use-gl=swiftshader',
      '--use-mock-keychain',
      '--disable-web-security',
      '--single-process'
    ];
    
    // 로컬 개발 환경과 프로덕션 환경 구분
    let puppeteer;
    let browserOptions: any = {
      headless: true,
      defaultViewport: chromium.defaultViewport,
    };
    
    if (isProduction || isVercel) {
      // 프로덕션/Vercel 환경: puppeteer-core + @sparticuz/chromium 사용
      puppeteer = await import('puppeteer-core');
      browserOptions.args = chromiumArgs;
      browserOptions.executablePath = await chromium.executablePath();
      console.log('[POST /api/poster] Using chromium at:', browserOptions.executablePath);
    } else {
      // 로컬 개발 환경: 일반 puppeteer 사용
      puppeteer = await import('puppeteer');
      browserOptions.args = ['--no-sandbox', '--disable-setuid-sandbox'];
      console.log('[POST /api/poster] Using local puppeteer');
    }
    
    browser = await puppeteer.default.launch(browserOptions);

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

