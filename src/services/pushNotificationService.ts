import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiClient } from '../api/apiClient';

const tokenStorageKey = (userId: string) => `@helptoyou:push-token:${userId}`;

export function getExpoProjectId(): string | undefined {
  return Constants.easConfig?.projectId || Constants.expoConfig?.extra?.eas?.projectId;
}

function getNotificationsModule() {
  try {
    return require('expo-notifications');
  } catch (err) {
    console.warn('[PushNotifications] Native notification module unavailable in this environment:', err);
    return null;
  }
}

export async function registerPushNotifications(userId: string, isActive: () => boolean = () => true) {
  if (Platform.OS === 'web' || !userId) return;

  const projectId = getExpoProjectId();
  if (!projectId) {
    return;
  }

  const Notifications = getNotificationsModule();
  if (!Notifications) return;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync?.('default', {
        name: 'HelpToYou updates',
        importance: 4,
        sound: 'default',
      });
    }

    let permission = await Notifications.getPermissionsAsync?.();
    if (!permission?.granted && permission?.canAskAgain !== false) {
      permission = await Notifications.requestPermissionsAsync?.();
    }
    if (!permission?.granted || !isActive()) return;

    const pushToken = await Notifications.getExpoPushTokenAsync?.({ projectId });
    if (!pushToken?.data || !isActive()) return;

    await apiClient.post('/api/v1/push-tokens', {
      token: pushToken.data,
      platform: Platform.OS,
    });
    if (!isActive()) {
      await apiClient.delete('/api/v1/push-tokens', { data: { token: pushToken.data } });
      return;
    }
    await AsyncStorage.setItem(tokenStorageKey(userId), pushToken.data);
  } catch (error) {
    console.warn('[PushNotifications] Registration skipped:', error);
  }
}

export async function unregisterPushNotifications(userId: string) {
  const token = await AsyncStorage.getItem(tokenStorageKey(userId));
  if (!token) return;
  try {
    await apiClient.delete('/api/v1/push-tokens', { data: { token } });
  } finally {
    await AsyncStorage.removeItem(tokenStorageKey(userId));
  }
}
