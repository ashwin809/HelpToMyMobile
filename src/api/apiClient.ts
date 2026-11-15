import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from '../constants/config';

export const apiClient = axios.create({
  ...(APP_CONFIG.apiBaseUrl ? { baseURL: APP_CONFIG.apiBaseUrl } : {}),
  timeout: APP_CONFIG.apiTimeout,
  headers: { Accept: 'application/json' },
});

const TOKEN_KEY = '@helptoyou:api-token';
const sessionExpiredListeners = new Set<() => void>();

export function onSessionExpired(listener: () => void): () => void {
  sessionExpiredListeners.add(listener);
  return () => { sessionExpiredListeners.delete(listener); };
}

export async function saveApiToken(token: string | null): Promise<void> {
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
    delete apiClient.defaults.headers.common.Authorization;
  }
}

export async function getStoredApiToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

apiClient.interceptors.request.use(async (request) => {
  const baseUrl = APP_CONFIG.apiBaseUrl;
  if (!baseUrl) {
    throw new Error('Set EXPO_PUBLIC_API_BASE_URL to the Node API address and restart Expo.');
  }
  request.baseURL = baseUrl;
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) request.headers.Authorization = `Bearer ${token}`;
  return request;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const sentAuthorization = error.config?.headers?.get('Authorization');
      if (typeof sentAuthorization === 'string' && sentAuthorization.startsWith('Bearer ')) {
        const currentToken = await AsyncStorage.getItem(TOKEN_KEY);
        if (currentToken && sentAuthorization === `Bearer ${currentToken}`) {
          await saveApiToken(null);
          sessionExpiredListeners.forEach((listener) => listener());
        }
      }
    }
    return Promise.reject(error);
  },
);
