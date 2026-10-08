import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

const tokenStorageKey = (userId: string) => `@helptoyou:push-token:${userId}`;
const tokenDocument = (userId: string, token: string) =>
  doc(db, 'users', userId, 'pushTokens', encodeURIComponent(token));

export function getExpoProjectId(): string | undefined {
  return Constants.easConfig?.projectId || Constants.expoConfig?.extra?.eas?.projectId;
}

export async function registerPushNotifications(userId: string, isActive: () => boolean = () => true) {
  if (Platform.OS === 'web' || !userId) return;

  const projectId = getExpoProjectId();
  if (!projectId) {
    console.warn('Push notifications need an EAS project ID in app.json (extra.eas.projectId).');
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'HelpToYou updates',
      importance: 4,
      sound: 'default',
    });
  }

  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted && permission.canAskAgain !== false) {
    permission = await Notifications.requestPermissionsAsync();
  }
  if (!permission.granted || !isActive()) return;

  const pushToken = await Notifications.getExpoPushTokenAsync({ projectId });
  if (!isActive()) return;

  await setDoc(tokenDocument(userId, pushToken.data), {
    token: pushToken.data,
    platform: Platform.OS,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  if (!isActive()) {
    await deleteDoc(tokenDocument(userId, pushToken.data));
    return;
  }
  await AsyncStorage.setItem(tokenStorageKey(userId), pushToken.data);
}

export async function unregisterPushNotifications(userId: string) {
  const token = await AsyncStorage.getItem(tokenStorageKey(userId));
  if (!token) return;
  await deleteDoc(tokenDocument(userId, token));
  await AsyncStorage.removeItem(tokenStorageKey(userId));
}
