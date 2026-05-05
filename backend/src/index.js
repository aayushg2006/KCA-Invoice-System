const express = require('express');
const cors = require('cors');

const { env } = require('./config/env');
const { closeBrowser } = require('./utils/browser');
const {
  createInvoice,
  getRecentInvoices,
  InvoiceValidationError,
} = require('./services/invoiceService');

const app = express();

app.use(
  cors({
    origin: env.corsOrigin === '*' ? true : env.corsOrigin,
  })
);
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'kca-invoice-backend',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/invoices/recent', async (req, res, next) => {
  try {
    const limit = Number.parseInt(String(req.query.limit || '20'), 10);
    const invoices = await getRecentInvoices(limit);
    res.json({ invoices });
  } catch (error) {
    next(error);
  }
});

app.post('/api/invoices', async (req, res, next) => {
  try {
    const result = await createInvoice(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);

  if (error instanceof InvoiceValidationError) {
    return res.status(400).json({
      message: error.message,
      issues: error.issues,
    });
  }

  return res.status(500).json({
    message: error.message || 'Something went wrong while creating the invoice.',
  });
});

const server = app.listen(env.port, () => {
  console.log(`KCA invoice backend running on http://localhost:${env.port}`);
});

const shutdown = async () => {
  server.close(async () => {
    await closeBrowser();
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
