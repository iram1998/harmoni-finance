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
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID if present in config
const db = firebaseConfig.firestoreDatabaseId 
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
