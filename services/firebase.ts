import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  Auth,
} from 'firebase/auth';
// @ts-ignore - getReactNativePersistence is exported by React Native entrypoint of firebase/auth
import { getReactNativePersistence } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  Firestore,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Firebase Web App Configuration from Expo Public environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBtyWtVEiOyLmX8HO719OSyhYQzYl3bBBI',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'bloom-968d5.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'bloom-968d5',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'bloom-968d5.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '772698292142',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:772698292142:web:0acef0e25552809eb4923f',
};

// 1. Initialize Firebase App (Singleton pattern)
let app: FirebaseApp;
if (getApps().length === 0) {
  try {
    app = initializeApp(firebaseConfig);
    console.log('[Firebase] Initialized App successfully');
  } catch (error) {
    console.error('[Firebase] Error initializing App:', error);
    app = getApp();
  }
} else {
  app = getApp();
}

// 2. Initialize Authentication with React Native Persistence
let auth: Auth;
try {
  if (Platform.OS === 'web') {
    auth = getAuth(app);
  } else {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  }
} catch (e: any) {
  // If initializeAuth was already called, fall back to getAuth
  auth = getAuth(app);
}

// 3. Initialize Cloud Firestore
let db: Firestore;
try {
  db = initializeFirestore(app, {});
} catch (e: any) {
  db = getFirestore(app);
}


// 4. Initialize Firebase Storage
let storage: FirebaseStorage;
try {
  storage = getStorage(app);
} catch (e: any) {
  console.warn('[Firebase] Storage initialization warning:', e);
  storage = getStorage(app);
}

export { app, auth, db, storage, firebaseConfig };
export default app;
