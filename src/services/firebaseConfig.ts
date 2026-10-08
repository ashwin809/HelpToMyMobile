import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeFirebaseAuth } from './firebaseAuth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY?.trim(),
  authDomain: "helptomymobile-6db75.firebaseapp.com",
  projectId: "helptomymobile-6db75",
  storageBucket: "helptomymobile-6db75.firebasestorage.app",
  messagingSenderId: "387934757635",
  appId: "1:387934757635:web:6ba7b8637b9d7ecad17f36",
  measurementId: "G-V8T3YX4RPW"
};

const firebaseApiKey = firebaseConfig.apiKey;

if (__DEV__) {
  // This diagnostic intentionally reports presence only; never log the API key.
  console.info('[Firebase config] EXPO_PUBLIC_FIREBASE_API_KEY present:', Boolean(firebaseApiKey));
}

if (!firebaseApiKey || firebaseApiKey === 'your_firebase_web_api_key') {
  throw new Error('Firebase API key is missing. Set EXPO_PUBLIC_FIREBASE_API_KEY in the project-root .env file and restart Expo.');
}

// A Fast Refresh can preserve Firebase's app registry after .env changes.
// Reuse only an app initialized with this exact project key; create a separate
// app instance if Metro preserved an older configuration.
const existingApp = getApps().find((candidate) =>
  candidate.options.apiKey === firebaseApiKey &&
  candidate.options.projectId === firebaseConfig.projectId
);
let appName = 'helptoyou_configured';
let suffix = 0;
while (getApps().some((candidate) => candidate.name === appName && candidate !== existingApp)) {
  suffix += 1;
  appName = `helptoyou_configured_${suffix}`;
}
const app = existingApp || initializeApp(firebaseConfig, appName);

const db = getFirestore(app);
// AsyncStorage keeps Firebase sessions available across native app restarts.
const auth = initializeFirebaseAuth(app, Boolean(existingApp));

export { app, db, auth };
