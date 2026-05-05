const puppeteer = require('puppeteer-core');

const { env } = require('../config/env');

let browserPromise = null;

async function getBrowser() {
  if (!env.browserPath) {
    throw new Error(
      'No Chrome/Edge browser was found. Set PUPPETEER_EXECUTABLE_PATH in backend/.env.'
    );
  }

  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      executablePath: env.browserPath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
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
