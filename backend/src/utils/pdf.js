const { getBrowser } = require('./browser');
const { createInvoiceHtml, getTemplateMeta } = require('./invoiceTemplate');

async function generateInvoicePdf(invoice) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  const template = getTemplateMeta();

  try {
    // --- NEW: Disable Puppeteer's default 30-second timeouts ---
    page.setDefaultNavigationTimeout(0);
    page.setDefaultTimeout(0);

    const html = createInvoiceHtml(invoice);
    await page.setViewport({
      width: template.width,
      height: template.height,
      deviceScaleFactor: 1,
    });
    
    await page.emulateMediaType('screen');
    
    // --- UPDATED: Added timeout: 0 to the options object ---
    await page.setContent(html, {
      waitUntil: ['domcontentloaded', 'networkidle0'],
      timeout: 0, 
    });

    const pdf = await page.pdf({
      width: `${template.width / 96}in`,
      height: `${template.height / 96}in`,
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px',
      },
    });

    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

module.exports = { generateInvoicePdf };