const fs = require('fs');
const admin = require('firebase-admin');

const { env } = require('./env');

function isGoogleCloudRuntime() {
  return Boolean(process.env.K_SERVICE || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT);
}

function parseServiceAccount(rawValue, sourceLabel) {
  try {
    return JSON.parse(rawValue);
  } catch (error) {
    throw new Error(`${sourceLabel} is not valid JSON: ${error.message}`);
  }
}

function loadServiceAccountFromFile() {
  if (!env.firebaseServiceAccountPath || !fs.existsSync(env.firebaseServiceAccountPath)) {
    return null;
  }

  return parseServiceAccount(
    fs.readFileSync(env.firebaseServiceAccountPath, 'utf8'),
    `Firebase service account file at ${env.firebaseServiceAccountPath}`
  );
}

function buildCredential() {
  if (env.firebaseServiceAccountJson) {
    return admin.credential.cert(
      parseServiceAccount(env.firebaseServiceAccountJson, 'FIREBASE_SERVICE_ACCOUNT_JSON')
    );
  }

  const fileServiceAccount = loadServiceAccountFromFile();

  if (fileServiceAccount) {
    return admin.credential.cert(fileServiceAccount);
  }

  if (isGoogleCloudRuntime()) {
    return admin.credential.applicationDefault();
  }

  throw new Error(
    'Firebase credentials are not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON, provide FIREBASE_SERVICE_ACCOUNT_PATH, or run this service in Google Cloud with Application Default Credentials.'
  );
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: buildCredential(),
    ...(env.firebaseStorageBucket ? { storageBucket: env.firebaseStorageBucket } : {}),
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

module.exports = { admin, bucket, db };
