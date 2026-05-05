// mobile_app/src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Replace this object with your actual keys from the Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyCPHiQufqeEDdRrCzu38gVxtDpX4pAAPro",
  authDomain: "kca-invoice-system.firebaseapp.com",
  projectId: "kca-invoice-system",
  storageBucket: "kca-invoice-system.firebasestorage.app",
  messagingSenderId: "1068187080493",
  appId: "1:1068187080493:web:20673ab373373bd3c9e5a4",
  measurementId: "G-CP631ERH2L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Auth and Database for use in your screens
export const auth = getAuth(app);
export const db = getFirestore(app);