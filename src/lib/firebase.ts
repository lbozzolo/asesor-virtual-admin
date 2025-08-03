import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDWBbg_g1GvRa6V5CXqFszpNaWVrVVmMsE",
  authDomain: "advisor-insights-ihqeg.firebaseapp.com",
  projectId: "advisor-insights-ihqeg",
  storageBucket: "advisor-insights-ihqeg.firebasestorage.app",
  messagingSenderId: "682568338474",
  appId: "1:682568338474:web:66cb003688c68d55fcc753",
  measurementId: ""
};

// Initialize Firebase
const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

export { firebaseApp, auth, db };
