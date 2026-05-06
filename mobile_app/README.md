# KCA Invoice System Mobile App

This folder contains the Expo / React Native client for the KCA Invoice System.

## Main screens

- `Create` tab for invoice creation
- `Recent` tab for invoice history and PDF resharing
- `invoice-preview` route for in-app PDF preview
- `modal` route for usage help

## Run locally

```bash
cd mobile_app
npm install
npx expo start
```

Optional API override:

```bash
set EXPO_PUBLIC_API_BASE_URL=http://YOUR_IP:4000/api
```

## Build commands

```bash
npm run lint
npm run android
npm run ios
npm run web
npx eas-cli build --platform android --profile preview
```

## Notes

- The primary invoice flow uses the backend API and does not directly write to Firebase from the app.
- The default deployed backend URL is configured in `app.json` and `eas.json`.
- For full system setup, backend configuration, Firebase cleanup steps, and deployment notes, see the root [README](../README.md).
