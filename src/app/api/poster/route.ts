/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

// Set runtime to nodejs (required for Puppeteer)
export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  let browser;
  
  try {
    const payload = await request.json().catch(() => ({}));
    const text = typeof payload?.text === 'string' ? payload.text : undefined;
    const searchParams = new URLSearchParams();
    searchParams.set('text', text ?? '');
    
    console.log('[POST /api/poster] text:', text);
    console.log('[POST /api/poster] VERCEL_ENV:', process.env.VERCEL_ENV);
    console.log('[POST /api/poster] NODE_ENV:', process.env.NODE_ENV);

    // Get the origin for navigation
    const origin = new URL(request.url).origin;

    // Determine if we're running on Vercel
    const isVercel = !!process.env.VERCEL_ENV;
    
    let puppeteer: any;
    let launchOptions: any = {
      headless: true,
    };
    
    if (isVercel) {
      // Vercel environment: use puppeteer-core with @sparticuz/chromium
      try {
        console.log('[POST /api/poster] Attempting to import @sparticuz/chromium...');
        const chromium = (await import('@sparticuz/chromium')).default;
        console.log('[POST /api/poster] @sparticuz/chromium imported successfully');
        
        puppeteer = await import('puppeteer-core');
        console.log('[POST /api/poster] puppeteer-core imported successfully');
        
        // Get executable path
        const execPath = await chromium.executablePath();
        console.log('[POST /api/poster] Chromium executable path:', execPath);
        
        // Check if file exists
        const fs = await import('fs');
        if (fs.existsSync(execPath)) {
          console.log('[POST /api/poster] Chromium binary exists at path');
        } else {
          console.error('[POST /api/poster] WARNING: Chromium binary NOT found at path');
        }
        
        // Additional args for better compatibility
        launchOptions = {
          ...launchOptions,
          args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
          executablePath: execPath,
          headless: 'new',
        };
        
        console.log('[POST /api/poster] Launch options prepared');
      } catch (importError) {
        console.error('[POST /api/poster] Error importing chromium:', importError);
        throw importError;
      }
    } else {
      // Local development: use regular puppeteer
      puppeteer = await import('puppeteer');
      launchOptions.args = ['--no-sandbox', '--disable-setuid-sandbox'];
      console.log('[POST /api/poster] Using local puppeteer');
    }
    
    browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });
    
    // Navigate to the poster page with waitUntil: 'networkidle2' as recommended in Vercel guide
    await page.goto(`${origin}/poster?${searchParams.toString()}`, { 
      waitUntil: 'networkidle2' 
    });
    
    // Take screenshot
    const screenshot = await page.screenshot({ type: 'png' });
    
    // Convert to base64 for JSON response
    const base64 = Buffer.from(screenshot).toString('base64');
    
    return NextResponse.json(
      { imageBase64: base64 },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('[POST /api/poster] error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate poster screenshot',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

