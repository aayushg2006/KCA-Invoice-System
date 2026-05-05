const fs = require('fs');
const path = require('path');

const { closeBrowser } = require('../utils/browser');
const { generateInvoicePdf } = require('../utils/pdf');

async function run() {
  const pdfBuffer = await generateInvoicePdf({
    invoiceNumber: 'KCA-2026-001',
    invoiceDate: new Date('2026-05-04T00:00:00.000Z'),
    studentName: 'Demo Student',
    parentName: 'Demo Parent',
    age: 12,
    mobileNumber: '9999988888',
    gmailId: 'demo@gmail.com',
    paymentMode: 'UPI',
    totalAmount: 4500,
    createdBy: 'Coach Demo',
    visibleCourseRows: [
      { title: 'Monthly Chess Coaching', amount: 3000 },
      { title: 'Tournament Prep', amount: 1000 },
      { title: 'Workbook', amount: 500 },
    ],
  });

  const outputDir = path.resolve(__dirname, '../../tmp');
  const outputPath = path.join(outputDir, 'kca-invoice-smoke.pdf');

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, pdfBuffer);

  console.log(`PDF smoke file generated at ${outputPath}`);
  await closeBrowser();
  process.exit(0);
}

run().catch((error) => {
  console.error(error);
  closeBrowser().finally(() => process.exit(1));
});
