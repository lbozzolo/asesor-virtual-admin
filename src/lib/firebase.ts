import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyA67xUpjVj_LSzSy0PcW6c9lWR1XsyyxUI",
  authDomain: "asesor-comercial-studyx.firebaseapp.com",
  projectId: "asesor-comercial-studyx",
  storageBucket: "asesor-comercial-studyx.firebasestorage.app",
  messagingSenderId: "334651698448",
  appId: "1:334651698448:web:2e8c74bd79ccfa61440995",
  measurementId: "G-48HV4WN2P4"
};

// Initialize Firebase App
const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

export { firebaseApp, auth, db };

// --- Gemini API Configuration ---

// IMPORTANT: ADD YOUR GEMINI API KEY HERE
// This key is used for server-side API calls.
export const GEMINI_API_KEY = "YOUR_API_KEY_HERE";

if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_API_KEY_HERE") {
  console.warn("La clave de API de Gemini no está configurada en `src/lib/firebase.ts`. El chat no funcionará.");
}

// Create a single, shared instance of the GoogleGenerativeAI client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// You can customize your model's configuration here
export const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash-latest',
  // You can define a global system instruction here if you have one.
  // systemInstruction: "Eres un asistente útil.", 
});