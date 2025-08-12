import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyA67xUpjVj_LSzSy0PcW6c9lWR1XsyyxUI",
  authDomain: "asesor-comercial-studyx.firebaseapp.com",
  projectId: "asesor-comercial-studyx",
  storageBucket: "asesor-comercial-studyx.appspot.com",
  messagingSenderId: "334651698448",
  appId: "1:334651698448:web:2e8c74bd79ccfa61440995",
  measurementId: "G-48HV4WN2P4"
};

// Initialize Firebase App
const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);


export { firebaseApp, auth, db };
