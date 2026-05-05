const test = require('node:test');
const assert = require('node:assert/strict');

const { createInvoiceHtml, formatDate, getTemplateMeta } = require('../utils/invoiceTemplate');

test('formatDate splits a date into DD MM YYYY parts', () => {
  assert.deepEqual(formatDate(new Date('2026-05-04T00:00:00.000Z')), {
    day: '04',
    month: '05',
    year: '2026',
  });
});

test('createInvoiceHtml includes invoice content and signature', () => {
  const template = getTemplateMeta();
  const html = createInvoiceHtml({
    invoiceDate: new Date('2026-05-04T00:00:00.000Z'),
    invoiceNumber: 'KCA-2026-001',
    studentName: 'Aarav',
    parentName: 'Meera',
    age: 10,
    mobileNumber: '9876543210',
    gmailId: 'student@gmail.com',
    paymentMode: 'UPI',
    totalAmount: 5000,
    createdBy: 'Coach KCA',
    visibleCourseRows: [{ title: 'Beginner Chess Camp', amount: 5000 }],
  });

  assert.match(html, /KCA-2026-001/);
  assert.match(html, /Aarav/);
  assert.match(html, new RegExp(`size: ${template.width}px ${template.height}px`));
  assert.match(html, /data:image\/svg\+xml;base64,/);
  assert.match(html, /AUTHORIZED STAMP/);
  assert.equal((html.match(/class="course-row"/g) || []).length, 1);
});
