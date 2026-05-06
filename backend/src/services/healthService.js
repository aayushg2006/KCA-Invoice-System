const { db, bucket } = require('../config/firebase');
const { getBrowser } = require('../utils/browser');
const { verifyMailerConnection } = require('../utils/mailer');

const DEFAULT_TIMEOUT_MS = 15000;

function withTimeout(promise, label, timeoutMs = DEFAULT_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${label} timed out after ${timeoutMs}ms.`));
      }, timeoutMs);
    }),
  ]);
}

async function runCheck(label, checkFn) {
  try {
    const details = await withTimeout(checkFn(), label);
    const explicitOk =
      details && typeof details === 'object' && typeof details.ok === 'boolean'
        ? details.ok
        : true;
    const normalizedDetails =
      details && typeof details === 'object' && Object.prototype.hasOwnProperty.call(details, 'ok')
        ? Object.fromEntries(Object.entries(details).filter(([key]) => key !== 'ok'))
        : details;

    return {
      ok: explicitOk,
      ...(normalizedDetails && typeof normalizedDetails === 'object'
        ? { details: normalizedDetails }
        : {}),
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message || `The ${label} check failed.`,
    };
  }
}

async function checkFirestore() {
  const snapshot = await db.collection('invoices').limit(1).get();

  return {
    querySucceeded: true,
    sampleCount: snapshot.size,
  };
}

async function checkStorage() {
  const [metadata] = await bucket.getMetadata();

  return {
    bucket: bucket.name,
    location: metadata.location || 'unknown',
  };
}

async function checkMailer() {
  return verifyMailerConnection();
}

async function checkBrowser() {
  const browser = await getBrowser();
  const version = await browser.version();

  return {
    version,
  };
}

async function getDependencyHealth() {
  const checks = {
    firestore: await runCheck('Firestore', checkFirestore),
    storage: await runCheck('Cloud Storage', checkStorage),
    mailer: await runCheck('SMTP', checkMailer),
    browser: await runCheck('Chromium', checkBrowser),
  };

  const ok = Object.values(checks).every((entry) => entry.ok);

  return {
    ok,
    checks,
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  getDependencyHealth,
};
