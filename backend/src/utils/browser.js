const puppeteer = require('puppeteer');
const { env } = require('../config/env');

let browserPromise = null;

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      // Uses your Windows path locally, but falls back to the cloud browser on Render
      executablePath: env.browserPath || undefined,
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage' // CRITICAL: Prevents the PDF generation from crashing on Render
      ],
    });
  }

  return browserPromise;
}

async function closeBrowser() {
  if (!browserPromise) {
    return;
  }

  const browser = await browserPromise;
  await browser.close();
  browserPromise = null;
}

module.exports = {
  closeBrowser,
  getBrowser,
};