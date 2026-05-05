const { getDefaultArtwork } = require('./invoiceArtwork');

const PAYMENT_MODES = ['Cash', 'UPI', 'Bank Transfer'];

function normalizeText(value, field) {
  const normalized = String(value || '').trim();

  if (!normalized) {
    throw new Error(`${field} is required.`);
  }

  return normalized;
}

function normalizeCourseDetails(courseDetails) {
  if (!Array.isArray(courseDetails) || courseDetails.length === 0) {
    throw new Error('At least one course detail row is required.');
  }

  const normalizedRows = courseDetails
    .map((row) => {
      const title = String(row?.title || '').trim();
      const amount = Number(row?.amount);

      if (!title) {
        return null;
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error(`Amount for "${title}" must be a valid number greater than 0.`);
      }

      return {
        title,
        amount: Number(amount.toFixed(2)),
      };
    })
    .filter(Boolean);

  if (normalizedRows.length === 0) {
    throw new Error('Please add at least one valid course detail row.');
  }

  return normalizedRows;
}

function buildVisibleCourseRows(courseDetails) {
  return courseDetails;
}

function validateInvoicePayload(payload) {
  const studentName = normalizeText(payload.studentName, 'Student name');
  const parentName = normalizeText(payload.parentName, 'Parent name');
  const mobileNumber = normalizeText(payload.mobileNumber, 'Mobile number');
  const gmailId = normalizeText(payload.gmailId, 'Gmail ID');
  const createdBy = normalizeText(payload.createdBy, 'Creator name');
  const { signatureDataUrl } = getDefaultArtwork();

  if (!gmailId.includes('@')) {
    throw new Error('Please enter a valid Gmail ID.');
  }

  const age = Number.parseInt(String(payload.age), 10);

  if (!Number.isInteger(age) || age <= 0 || age > 100) {
    throw new Error('Please enter a valid student age.');
  }

  const paymentMode = PAYMENT_MODES.includes(payload.paymentMode)
    ? payload.paymentMode
    : 'Cash';

  const invoiceDate = new Date(payload.invoiceDate || Date.now());

  if (Number.isNaN(invoiceDate.getTime())) {
    throw new Error('Please enter a valid invoice date.');
  }

  const normalizedCourseDetails = normalizeCourseDetails(payload.courseDetails);
  const visibleCourseRows = buildVisibleCourseRows(normalizedCourseDetails);
  const totalAmount = Number(
    normalizedCourseDetails.reduce((total, row) => total + row.amount, 0).toFixed(2)
  );

  return {
    age,
    courseDetails: normalizedCourseDetails,
    createdBy,
    gmailId,
    invoiceDate,
    mobileNumber,
    parentName,
    paymentMode,
    signatureDataUrl,
    studentName,
    totalAmount,
    visibleCourseRows,
  };
}

module.exports = {
  PAYMENT_MODES,
  buildVisibleCourseRows,
  validateInvoicePayload,
};
