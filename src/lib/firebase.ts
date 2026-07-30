import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInAnonymously, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs,
  query, 
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
// Safely load local firebase-applet-config.json without breaking build if file is absent in git repo (e.g. Vercel)
const configModules = import.meta.glob('../../firebase-applet-config.json', { eager: true });
const localConfig = (Object.values(configModules)[0] as { default?: Record<string, string> })?.default || {};

// Deteksi apakah sedang berjalan di AI Studio (localhost / .run.app)
const isAIStudio = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || 
  window.location.hostname.includes('.run.app')
);

const isVercel = !isAIStudio && !!import.meta.env.VITE_FIREBASE_PROJECT_ID;

let overrideConfig: any = null;
let isProdOverride = false;
if (typeof window !== 'undefined') {
  isProdOverride = localStorage.getItem('override_sandbox_db') === 'true';
  if (isProdOverride) {
    try {
      overrideConfig = JSON.parse(localStorage.getItem('sandbox_override_config') || '{}');
    } catch(e) {
      console.error("Invalid override config");
    }
  }
}

// helper to get the config value
const getConfigValue = (key: string, envKey: string, fallback: string) => {
  if (isAIStudio && isProdOverride && overrideConfig && overrideConfig[key]) {
    return overrideConfig[key];
  }
  if (!isAIStudio && import.meta.env[envKey]) {
    return import.meta.env[envKey];
  }
  return localConfig[key] || fallback;
};

const firebaseConfig = {
  projectId: getConfigValue('projectId', 'VITE_FIREBASE_PROJECT_ID', "organic-loader-grmnt"),
  appId: getConfigValue('appId', 'VITE_FIREBASE_APP_ID', "1:648361121013:web:3ff5f7deba9360a1e1e1bc"),
  apiKey: getConfigValue('apiKey', 'VITE_FIREBASE_API_KEY', "AIzaSyAaxXSnoWQZPZasoqc7Yy6_rh2SkhqrhGA"),
  authDomain: getConfigValue('authDomain', 'VITE_FIREBASE_AUTH_DOMAIN', "organic-loader-grmnt.firebaseapp.com"),
  firestoreDatabaseId: isAIStudio && isProdOverride && overrideConfig && overrideConfig.firestoreDatabaseId 
    ? overrideConfig.firestoreDatabaseId 
    : (!isAIStudio && import.meta.env.VITE_FIREBASE_DATABASE_ID)
      ? import.meta.env.VITE_FIREBASE_DATABASE_ID
      : isVercel 
        ? "(default)" 
        : localConfig.firestoreDatabaseId || "ai-studio-harmonifinansial-3841d967-f381-4803-b6e7-b0b4fcdc5ca8",
  storageBucket: getConfigValue('storageBucket', 'VITE_FIREBASE_STORAGE_BUCKET', "organic-loader-grmnt.firebasestorage.app"),
  messagingSenderId: getConfigValue('messagingSenderId', 'VITE_FIREBASE_MESSAGING_SENDER_ID', "648361121013"),
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID if present in config
const db = (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)')
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { 
  app, 
  db, 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInAnonymously, 
  firebaseSignOut, 
  onAuthStateChanged,
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs,
  query, 
  where,
  orderBy,
  serverTimestamp,
  firebaseConfig,
  isVercel,
  isAIStudio,
  isProdOverride
};
export type { User };
