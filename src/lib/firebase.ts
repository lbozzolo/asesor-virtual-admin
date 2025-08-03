import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDhZkMugH_6BM-5XSfO0mbgdFlsaQe2GuI",
  authDomain: "asesor-comercial-studyx.firebaseapp.com",
  projectId: "asesor-comercial-studyx",
  storageBucket: "asesor-comercial-studyx.firebasestorage.app",
  messagingSenderId: "334651698448",
  appId: "1:334651698448:web:2e8c74bd79ccfa61440995",
  measurementId: "G-48HV4WN2P4"
};

// Initialize Firebase
const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

export { firebaseApp, auth, db };
