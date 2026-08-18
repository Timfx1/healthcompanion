import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { Auth } from "firebase/auth";
import { Firestore, getFirestore, initializeFirestore } from "firebase/firestore";

declare const require: (moduleName: string) => unknown;

type FirebaseAuthModule = typeof import("firebase/auth") & {
  getReactNativePersistence: (storage: typeof AsyncStorage) => unknown;
};

const { initializeAuth, getAuth, getReactNativePersistence } = require("firebase/auth") as FirebaseAuthModule;

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

const app = isFirebaseConfigured ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null;

let initializedAuth: Auth | null = null;

if (app) {
  try {
    initializedAuth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage) as never
    });
  } catch {
    initializedAuth = getAuth(app);
  }
}

export const firebaseApp = app;
export const auth = initializedAuth;

let initializedDb: Firestore | null = null;

if (app) {
  try {
    initializedDb = initializeFirestore(app, {
      experimentalForceLongPolling: true
    });
  } catch {
    initializedDb = getFirestore(app);
  }
}

export const db: Firestore | null = initializedDb;

if (__DEV__) {
  if (isFirebaseConfigured && firebaseApp && auth && db) {
    console.log("[AnklePath/Firebase] Connected", {
      projectId: firebaseConfig.projectId,
      auth: "available",
      firestore: "available",
      appsInitialized: getApps().length
    });
  } else {
    console.log("[AnklePath/Firebase] Not configured. Add EXPO_PUBLIC_FIREBASE_* values to .env.");
  }
}
