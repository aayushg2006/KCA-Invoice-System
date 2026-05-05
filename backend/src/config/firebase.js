const fs = require('fs');
const admin = require('firebase-admin');

const { env } = require('./env');

function loadServiceAccount() {
  if (!env.firebaseServiceAccountPath) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_PATH is missing. Add it to backend/.env and point it to your local Firebase service account JSON file.'
    );
  }

  if (!fs.existsSync(env.firebaseServiceAccountPath)) {
    throw new Error(
      `Firebase service account file was not found at ${env.firebaseServiceAccountPath}. Update FIREBASE_SERVICE_ACCOUNT_PATH in backend/.env.`
    );
  }

  return JSON.parse(fs.readFileSync(env.firebaseServiceAccountPath, 'utf8'));
}

if (!admin.apps.length) {
  const serviceAccount = loadServiceAccount();

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    ...(env.firebaseStorageBucket ? { storageBucket: env.firebaseStorageBucket } : {}),
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

module.exports = { admin, bucket, db };
