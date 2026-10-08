import { FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Web Auth uses Firebase's browser persistence; native builds use firebaseAuth.native.ts.
export function initializeFirebaseAuth(app: FirebaseApp, _hasExistingApp: boolean) {
  return getAuth(app);
}
