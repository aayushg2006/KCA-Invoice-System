const crypto = require('crypto');

const { admin, bucket, db } = require('../config/firebase');
const { generateInvoicePdf } = require('../utils/pdf');
const { sendInvoiceEmail } = require('../utils/mailer');
const { validateInvoicePayload } = require('../utils/invoiceValidation');

class InvoiceValidationError extends Error {
  constructor(message, issues = []) {
    super(message);
    this.name = 'InvoiceValidationError';
    this.issues = issues;
  }
}

function formatInvoiceNumber(year, sequenceNumber) {
  return `KCA-${year}-${String(sequenceNumber).padStart(3, '0')}`;
}

async function getNextInvoiceNumber(invoiceDate) {
  const counterRef = db.collection('counters').doc('invoiceCounter');
  const invoiceYear = invoiceDate.getFullYear();

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(counterRef);
    const currentData = snapshot.exists ? snapshot.data() : {};
    const sameYear = currentData.year === invoiceYear;
    const lastNumber = sameYear ? Number(currentData.lastNumber || 0) : 0;
    const nextNumber = lastNumber + 1;
    const invoiceNumber = formatInvoiceNumber(invoiceYear, nextNumber);

    transaction.set(
      counterRef,
      {
        description: 'Tracks the latest invoice number for auto-generation',
        lastNumber: nextNumber,
        prefix: `KCA-${invoiceYear}-`,
        updatedAt: admin.firestore.Timestamp.now(),
        year: invoiceYear,
      },
      { merge: true }
    );

    return {
      invoiceNumber,
      invoiceYear,
      sequenceNumber: nextNumber,
    };
  });
}

async function uploadPdf(invoiceNumber, invoiceYear, pdfBuffer) {
  const storagePath = `invoices/${invoiceYear}/${invoiceNumber}.pdf`;
  const downloadToken = crypto.randomUUID();
  const file = bucket.file(storagePath);

  await file.save(pdfBuffer, {
    contentType: 'application/pdf',
    metadata: {
      contentType: 'application/pdf',
      metadata: {
        firebaseStorageDownloadTokens: downloadToken,
      },
    },
    resumable: false,
  });

  const encodedPath = encodeURIComponent(storagePath);
  const pdfUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${downloadToken}`;

  return {
    pdfUrl,
    storagePath,
  };
}

function serializeTimestamp(timestamp) {
  if (!timestamp) {
    return null;
  }

  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toISOString();
  }

  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }

  return timestamp;
}

function serializeInvoiceDocument(docId, data) {
  return {
    id: docId,
    invoiceNumber: data.invoiceNumber,
    invoiceDate: serializeTimestamp(data.invoiceDate),
    studentName: data.studentName,
    parentName: data.parentName,
    age: data.age,
    mobileNumber: data.mobileNumber,
    gmailId: data.gmailId,
    courseDetails: data.courseDetails,
    paymentMode: data.paymentMode,
    totalAmount: data.totalAmount,
    createdBy: data.createdBy,
    pdfUrl: data.pdfUrl,
    emailStatus: data.emailStatus || 'unknown',
    emailMessage: data.emailMessage || '',
    createdAt: serializeTimestamp(data.createdAt),
  };
}

async function createInvoice(payload) {
  let normalizedPayload;

  try {
    normalizedPayload = validateInvoicePayload(payload);
  } catch (error) {
    throw new InvoiceValidationError(error.message);
  }

  const numbering = await getNextInvoiceNumber(normalizedPayload.invoiceDate);
  const now = admin.firestore.Timestamp.now();
  const invoiceRecord = {
    ...normalizedPayload,
    createdAt: now,
    invoiceDate: admin.firestore.Timestamp.fromDate(normalizedPayload.invoiceDate),
    invoiceNumber: numbering.invoiceNumber,
    invoiceYear: numbering.invoiceYear,
    sequenceNumber: numbering.sequenceNumber,
  };

  const pdfBuffer = await generateInvoicePdf({
    ...invoiceRecord,
    invoiceDate: normalizedPayload.invoiceDate,
  });
  const uploadResult = await uploadPdf(
    invoiceRecord.invoiceNumber,
    invoiceRecord.invoiceYear,
    pdfBuffer
  );

  let emailResult;

  try {
    emailResult = await sendInvoiceEmail(invoiceRecord, pdfBuffer);
  } catch (error) {
    emailResult = {
      status: 'failed',
      message: error.message || 'Failed to send the invoice email.',
    };
  }

  const firestorePayload = {
    age: invoiceRecord.age,
    courseDetails: invoiceRecord.courseDetails,
    createdAt: invoiceRecord.createdAt,
    createdBy: invoiceRecord.createdBy,
    emailMessage: emailResult.message,
    emailStatus: emailResult.status,
    gmailId: invoiceRecord.gmailId,
    invoiceDate: invoiceRecord.invoiceDate,
    invoiceNumber: invoiceRecord.invoiceNumber,
    invoiceYear: invoiceRecord.invoiceYear,
    mobileNumber: invoiceRecord.mobileNumber,
    parentName: invoiceRecord.parentName,
    paymentMode: invoiceRecord.paymentMode,
    pdfStoragePath: uploadResult.storagePath,
    pdfUrl: uploadResult.pdfUrl,
    sequenceNumber: invoiceRecord.sequenceNumber,
    signatureCaptured: true,
    studentName: invoiceRecord.studentName,
    totalAmount: invoiceRecord.totalAmount,
    updatedAt: now,
  };

  const invoiceRef = db.collection('invoices').doc(invoiceRecord.invoiceNumber);
  await invoiceRef.set(firestorePayload);

  return {
    invoice: serializeInvoiceDocument(invoiceRef.id, firestorePayload),
    message:
      emailResult.status === 'sent'
        ? 'Invoice created, mailed, and stored successfully.'
        : 'Invoice created and stored successfully. Email delivery needs attention.',
  };
}

async function getRecentInvoices(limit = 20) {
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 50) : 20;
  const snapshot = await db
    .collection('invoices')
    .orderBy('createdAt', 'desc')
    .limit(safeLimit + 5)
    .get();

  return snapshot.docs
    .map((doc) => ({ id: doc.id, data: doc.data() }))
    .filter((entry) => entry.data.signatureCaptured !== false)
    .slice(0, safeLimit)
    .map((entry) => serializeInvoiceDocument(entry.id, entry.data));
}

module.exports = {
  createInvoice,
  getRecentInvoices,
  InvoiceValidationError,
  formatInvoiceNumber,
};
