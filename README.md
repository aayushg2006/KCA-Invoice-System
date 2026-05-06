# KCA Invoice System

KCA Invoice System is a production-ready invoice and fee receipt workflow for Kamath Chess Academy. The mobile app creates branded invoices, the backend generates the PDF, Firebase stores the record and file, and the system emails the invoice to the recipient.

## What the system does

- Creates KCA invoice numbers in the format `KCA-YYYY-001`.
- Captures student, parent, contact, course, payment, and creator details.
- Builds the final invoice PDF with KCA branding, stamp, and signature artwork.
- Uploads each PDF to Firebase Storage.
- Stores invoice metadata in Firestore.
- Emails the generated invoice PDF to the recipient.
- Lets staff reopen and reshare recent invoices from the mobile app.

## Current production behavior

- The mobile app talks to the backend API. The main invoice flow does not write directly to Firebase from the app.
- The backend owns invoice numbering, PDF creation, Firebase writes, and email delivery.
- Invoice numbering is year-based and auto-increments from Firestore.
- The current app is designed for internal academy operations. There is no login/authentication layer in the mobile client or backend API at this time.

## System flow

1. A staff member fills the invoice form in the mobile app.
2. The app sends the payload to `POST /api/invoices`.
3. The backend validates the payload and generates the next invoice number.
4. Puppeteer renders the branded invoice PDF.
5. The backend uploads the PDF to Firebase Storage.
6. The backend emails the PDF to the provided Gmail address.
7. The backend stores the invoice record in Firestore.
8. The app opens an in-app preview and allows the PDF to be shared again later.

## Repository structure

```text
KCA-Invoice-System/
|-- backend/
|   |-- assets/
|   |-- src/
|   |   |-- config/
|   |   |-- scripts/
|   |   |-- services/
|   |   |-- tests/
|   |   `-- utils/
|   `-- Dockerfile
|-- mobile_app/
|   |-- app/
|   |-- assets/
|   |-- components/
|   |-- constants/
|   |-- hooks/
|   `-- src/
`-- README.md
```

## Core modules

### Mobile app

- Expo Router app with two main tabs: `Create` and `Recent`.
- `Create` tab submits invoice data to the backend.
- `Recent` tab loads recent invoices from the backend and allows PDF reopen/share.
- `invoice-preview` route renders the PDF in-app with WebView.

### Backend

- Express API for invoice creation and invoice history.
- Firestore transaction for invoice counter management.
- Puppeteer-based PDF generation.
- Firebase Storage upload for PDFs.
- Nodemailer-based invoice delivery.
- Health endpoints for app, Firestore, Storage, SMTP, and browser readiness.

## Tech stack

- Mobile: Expo SDK 54, React Native 0.81, Expo Router
- Backend: Node.js, Express 5
- Data: Firestore
- File storage: Firebase Storage
- PDF engine: Puppeteer + Chromium
- Email: Nodemailer
- Android distribution: EAS Build

## Local development

### Prerequisites

- Node.js 20+ recommended
- npm
- Firebase project with Firestore and Storage enabled
- Firebase service account credentials
- SMTP or Gmail App Password for email sending
- Chrome or Edge installed locally, or a valid `PUPPETEER_EXECUTABLE_PATH`

### Backend setup

```bash
cd backend
npm install
copy .env.example .env
```

Fill `backend/.env` with real values before starting the backend.

#### Backend environment variables

| Variable | Required | Purpose |
|---|---|---|
| `PORT` | No | Backend port. Defaults to `4000`. |
| `CORS_ORIGIN` | Yes for production | Frontend origin allowed by the API. Current default is `*`. |
| `FIREBASE_STORAGE_BUCKET` | Yes | Firebase Storage bucket used for invoice PDFs. |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Yes if not using file/ADC | Raw JSON for the Firebase service account. |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Optional | Local JSON file path for development credentials. |
| `SMTP_SERVICE` | Optional | Email service name such as `gmail`. |
| `SMTP_HOST` | Optional | Custom SMTP host if not using `SMTP_SERVICE`. |
| `SMTP_PORT` | Optional | SMTP port. Defaults to `465`. |
| `SMTP_SECURE` | Optional | `true`/`false` for secure SMTP. |
| `SMTP_USER` | Yes for email sending | SMTP username or sender email. |
| `SMTP_PASS` | Yes for email sending | SMTP password or Gmail App Password. |
| `SMTP_FROM_EMAIL` | Optional | From address used in outgoing mail. |
| `SMTP_FROM_NAME` | Optional | Display name for outgoing mail. |
| `PUPPETEER_EXECUTABLE_PATH` | Optional | Local Chrome/Edge path if Puppeteer auto-detection is not enough. |

### Backend commands

```bash
cd backend
npm run dev
npm start
npm run init:db
npm run smoke:pdf
npm test
```

Notes:

- `npm run init:db` creates seed data. Use it only when you actually want the seed documents.
- `npm run smoke:pdf` is useful for checking that the PDF engine works before go-live.

### Mobile app setup

```bash
cd mobile_app
npm install
npx expo start
```

Optional local override:

```bash
set EXPO_PUBLIC_API_BASE_URL=http://YOUR_IP:4000/api
```

The current app config already points to the deployed Cloud Run backend by default.

### Mobile commands

```bash
cd mobile_app
npm run lint
npm run android
npm run ios
npm run web
```

## API reference

### `GET /api/health`

Returns a basic backend readiness response.

### `GET /api/health/dependencies`

Checks:

- Firestore
- Firebase Storage
- SMTP
- Chromium / Puppeteer

### `GET /api/invoices/recent?limit=25`

Returns recent invoice records. The backend caps the result size to 50.

### `POST /api/invoices`

Expected payload:

```json
{
  "studentName": "Student Name",
  "parentName": "Parent Name",
  "age": 12,
  "mobileNumber": "9876543210",
  "gmailId": "parent@gmail.com",
  "createdBy": "Admin Name",
  "invoiceDate": "2026-05-06",
  "paymentMode": "UPI",
  "courseDetails": [
    { "title": "Monthly Chess Coaching", "amount": 2500 }
  ]
}
```

Success response includes:

- Stored invoice record
- Public PDF URL
- Email delivery status message

## Firebase data layout

### Firestore

`counters/invoiceCounter`

- Tracks the last invoice number used for the active year.

`invoices/{invoiceNumber}`

- Main invoice record.
- Includes student details, course rows, payment mode, total amount, PDF URL, storage path, email status, and timestamps.

`users/admin_init`

- Seed record created by `npm run init:db`.
- Not required for invoice creation.

### Firebase Storage

`invoices/{year}/{invoiceNumber}.pdf`

- Stores each generated PDF.

## Deployment notes

### Backend

- Dockerized for container deployment.
- Current Docker image installs Chromium and runs the backend on port `8080`.
- Works well on Google Cloud Run.

### Android app

- `mobile_app/eas.json` defines:
  - `preview` -> APK build
  - `production` -> Android App Bundle

Build commands:

```bash
cd mobile_app
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform android --profile production
```

If local Windows native builds hit TLS or `bad_record_mac` issues, use EAS remote build. That path has already been validated for this project.

## Go-live checklist

- Replace all test SMTP credentials with production credentials.
- Confirm the Firebase project is the production project.
- Confirm `FIREBASE_STORAGE_BUCKET` points to the correct production bucket.
- Confirm the backend service account has Firestore and Storage access.
- Lock down `CORS_ORIGIN` in production instead of using `*`.
- Run `GET /api/health/dependencies` and confirm all checks are healthy.
- Remove old test invoices from Firestore and Storage.
- Reset the invoice counter before the first real invoice if you want numbering to restart from `001`.

## How to remove previous test data from Firebase before go-live

Do this carefully and only after backing up data you may want later.

### Safe preparation

1. Stop the backend or temporarily prevent staff from creating invoices.
2. Export or manually back up Firestore and Storage if you might need old test records.
3. Confirm you are in the correct Firebase project before deleting anything.

### Firestore cleanup

Delete the `invoices` collection contents:

- Open Firebase Console.
- Go to Firestore Database.
- Open the `invoices` collection.
- Delete all test invoice documents.
- If present, delete the seed document `schema_init`.

Reset invoice numbering:

- Go to the `counters` collection.
- Delete the `invoiceCounter` document entirely, or edit it so:
  - `lastNumber = 0`
  - `year = current year`
  - `prefix = KCA-CURRENTYEAR-`

Optional seed cleanup:

- Open the `users` collection.
- Delete `admin_init` if you do not want the seed user to remain.

Important:

- Do not rerun `npm run init:db` after cleanup unless you intentionally want seed documents to come back.
- The backend can recreate `counters/invoiceCounter` automatically on the first real invoice if the document is missing.

### Storage cleanup

Delete test PDFs:

- Open Firebase Console.
- Go to Storage.
- Open the `invoices/` folder.
- Delete the year folders or all test PDFs inside them.

If you want a fully clean launch, remove all existing files inside `invoices/` so only real-user invoices exist going forward.

### Final verification

After cleanup:

1. Restart the backend.
2. Call `GET /api/health/dependencies`.
3. Confirm Firestore and Storage are reachable.
4. Create one controlled final test invoice only if you are comfortable keeping it as invoice `001`.

If you want invoice `001` reserved for the first real customer, do not create another test invoice after cleanup.

## Operational notes

- The backend filters out seeded invoices where `signatureCaptured === false` from the recent invoice list.
- The app saves PDFs into a device cache folder before preview/share.
- The app can still create invoices even if email sending fails; the backend stores the invoice and returns the email status.

## Current artifact location

The latest locally downloaded APK can be stored at:

`mobile_app/builds/KCA-Invoice-System-preview.apk`
