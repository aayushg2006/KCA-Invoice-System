const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildVisibleCourseRows,
  validateInvoicePayload,
} = require('../utils/invoiceValidation');

test('buildVisibleCourseRows keeps every course row visible for the PDF', () => {
  const rows = buildVisibleCourseRows([
    { title: 'Starter', amount: 1000 },
    { title: 'Rapid', amount: 1500 },
    { title: 'Puzzle', amount: 500 },
    { title: 'Tournament', amount: 2000 },
  ]);

  assert.equal(rows.length, 4);
  assert.deepEqual(rows[3], { title: 'Tournament', amount: 2000 });
});

test('validateInvoicePayload normalizes and totals a valid request', () => {
  const invoice = validateInvoicePayload({
    studentName: '  Ria ',
    parentName: ' Ajay ',
    age: '12',
    mobileNumber: '9999988888',
    gmailId: 'ria@gmail.com',
    paymentMode: 'Cash',
    createdBy: 'Coach Priya',
    invoiceDate: '2026-05-04',
    courseDetails: [
      { title: 'Monthly Coaching', amount: 3000 },
      { title: 'Workbook', amount: 500 },
    ],
  });

  assert.equal(invoice.studentName, 'Ria');
  assert.equal(invoice.totalAmount, 3500);
  assert.equal(invoice.visibleCourseRows.length, 2);
  assert.match(invoice.signatureDataUrl, /^data:image\/svg\+xml;base64,/);
});

test('validateInvoicePayload rejects invalid email values', () => {
  assert.throws(
    () =>
      validateInvoicePayload({
        studentName: 'Ria',
        parentName: 'Ajay',
        age: 12,
        mobileNumber: '9999988888',
        gmailId: 'invalid-email',
        paymentMode: 'Cash',
        createdBy: 'Coach Priya',
        invoiceDate: '2026-05-04',
        courseDetails: [{ title: 'Monthly Coaching', amount: 3000 }],
      }),
    /valid Gmail ID/
  );
});
