import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDqp0hNhx8OtvpZxPD4Xcrx6G6vI0RhiIo",
  authDomain: "icehockeylive-01.firebaseapp.com",
  projectId: "icehockeylive-01",
  storageBucket: "icehockeylive-01.firebasestorage.app",
  messagingSenderId: "336185071649",
  appId: "1:336185071649:web:7c2193ac08675a896a6b60",
  measurementId: "G-20NWW4GNWM"
};

// Default to env variables, custom localStorage, or DEFAULT_FIREBASE_CONFIG
export function getFirebaseConfig() {
  const customConfigStr = typeof window !== 'undefined' ? localStorage.getItem('nhl_hockey_firebase_config') : null;
  if (customConfigStr) {
    try {
      const parsed = JSON.parse(customConfigStr);
      if (parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse custom Firebase config:', e);
    }
  }

  const envConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  };

  if (envConfig.apiKey && envConfig.projectId) {
    return envConfig;
  }

  return DEFAULT_FIREBASE_CONFIG;
}

let app = null;
let db = null;
let analytics = null;
const activeConfig = getFirebaseConfig();

if (activeConfig && activeConfig.apiKey) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(activeConfig);
    db = getFirestore(app);
    if (typeof window !== 'undefined') {
      isSupported().then(supported => {
        if (supported) {
          analytics = getAnalytics(app);
        }
      }).catch(() => {});
    }
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

export { app, db, analytics, activeConfig };
export const isFirebaseConfigured = Boolean(db);

export function saveCustomFirebaseConfig(config) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('nhl_hockey_firebase_config', JSON.stringify(config));
    window.location.reload();
  }
}

export function clearCustomFirebaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('nhl_hockey_firebase_config');
    window.location.reload();
  }
}
