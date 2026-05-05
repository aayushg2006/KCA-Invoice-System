const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const backendRoot = path.resolve(__dirname, '../..');
const envPath = path.join(backendRoot, '.env');

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

function readString(name, fallback = '') {
  const value = process.env[name];

  if (typeof value !== 'string') {
    return fallback;
  }

  return value.trim();
}

function readNumber(name, fallback) {
  const parsedValue = Number.parseInt(readString(name), 10);
  return Number.isNaN(parsedValue) ? fallback : parsedValue;
}

function readBoolean(name, fallback) {
  const rawValue = readString(name);

  if (!rawValue) {
    return fallback;
  }

  return !['0', 'false', 'no', 'off'].includes(rawValue.toLowerCase());
}

function resolveFromBackendRoot(value) {
  if (!value) {
    return '';
  }

  return path.isAbsolute(value) ? value : path.resolve(backendRoot, value);
}

const defaultBrowserPaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];

const detectedBrowserPath =
  readString('PUPPETEER_EXECUTABLE_PATH') ||
  defaultBrowserPaths.find((candidate) => fs.existsSync(candidate)) ||
  '';

const env = {
  port: readNumber('PORT', 4000),
  corsOrigin: readString('CORS_ORIGIN', '*'),
  firebaseStorageBucket: readString('FIREBASE_STORAGE_BUCKET'),
  firebaseServiceAccountPath: resolveFromBackendRoot(
    readString('FIREBASE_SERVICE_ACCOUNT_PATH', './src/config/firebase-service-account.json')
  ),
  smtpService: readString('SMTP_SERVICE', 'gmail'),
  smtpHost: readString('SMTP_HOST'),
  smtpPort: readNumber('SMTP_PORT', 465),
  smtpSecure: readBoolean('SMTP_SECURE', true),
  smtpUser: readString('SMTP_USER'),
  smtpPass: readString('SMTP_PASS'),
  smtpFromEmail: readString('SMTP_FROM_EMAIL') || readString('SMTP_USER'),
  smtpFromName: readString('SMTP_FROM_NAME', 'Invoice System'),
  browserPath: detectedBrowserPath,
};

module.exports = { env };
