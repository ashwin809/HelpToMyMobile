import { FirebaseApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import { getAuth, initializeAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function initializeFirebaseAuth(app: FirebaseApp, hasExistingApp: boolean) {
  return hasExistingApp
    ? getAuth(app)
    : initializeAuth(app, {
        persistence: (FirebaseAuth as unknown as {
          getReactNativePersistence: (storage: typeof AsyncStorage) => NonNullable<Parameters<typeof initializeAuth>[1]>['persistence'];
        }).getReactNativePersistence(AsyncStorage),
      });
}
