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

const isVercel = !!import.meta.env.VITE_FIREBASE_PROJECT_ID;

const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || localConfig.projectId || "organic-loader-grmnt",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || localConfig.appId || "1:648361121013:web:3ff5f7deba9360a1e1e1bc",
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || localConfig.apiKey || "AIzaSyAaxXSnoWQZPZasoqc7Yy6_rh2SkhqrhGA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || localConfig.authDomain || "organic-loader-grmnt.firebaseapp.com",
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || (isVercel ? "(default)" : localConfig.firestoreDatabaseId) || "ai-studio-harmonifinansial-3841d967-f381-4803-b6e7-b0b4fcdc5ca8",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || localConfig.storageBucket || "organic-loader-grmnt.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || localConfig.messagingSenderId || "648361121013",
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
  serverTimestamp
};
export type { User };
