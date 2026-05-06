const nodemailer = require('nodemailer');

const { env } = require('../config/env');

let transporter = null;

function getTransporter() {
  if (!env.smtpUser || !env.smtpPass) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport(
      env.smtpHost
        ? {
            host: env.smtpHost,
            port: env.smtpPort,
            secure: env.smtpSecure,
            auth: {
              user: env.smtpUser,
              pass: env.smtpPass,
            },
          }
        : {
            service: env.smtpService,
            auth: {
              user: env.smtpUser,
              pass: env.smtpPass,
            },
          }
    );
  }

  return transporter;
}

async function verifyMailerConnection() {
  const activeTransporter = getTransporter();

  if (!activeTransporter) {
    return {
      ok: false,
      reason: 'SMTP credentials are missing.',
    };
  }

  await activeTransporter.verify();

  return {
    ok: true,
    provider: env.smtpHost || env.smtpService,
  };
}

function buildInvoiceEmail(invoice) {
  return {
    subject: `KCA Invoice ${invoice.invoiceNumber}`,
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; color: #0f172a;">
        <p>Hello,</p>
        <p>Please find your Kamath Chess Academy invoice attached.</p>
        <p><strong>Invoice No:</strong> ${invoice.invoiceNumber}</p>
        <p><strong>Student Name:</strong> ${invoice.studentName}</p>
        <p><strong>Total Amount Paid:</strong> Rs. ${invoice.totalAmount}</p>
        <p>Thank you for choosing Kamath Chess Academy.</p>
      </div>
    `,
  };
}

async function sendInvoiceEmail(invoice, pdfBuffer) {
  const activeTransporter = getTransporter();

  if (!activeTransporter) {
    return {
      status: 'not_configured',
      message: 'SMTP credentials are missing, so the invoice email was skipped.',
    };
  }

  const message = buildInvoiceEmail(invoice);

  await activeTransporter.sendMail({
    from: `"${env.smtpFromName}" <${env.smtpFromEmail}>`,
    to: invoice.gmailId,
    subject: message.subject,
    html: message.html,
    attachments: [
      {
        filename: `${invoice.invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });

  return {
    status: 'sent',
    message: `Invoice mailed to ${invoice.gmailId}.`,
  };
}

module.exports = {
  getTransporter,
  sendInvoiceEmail,
  verifyMailerConnection,
};
