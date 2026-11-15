import Constants from 'expo-constants';
import { Platform } from 'react-native';

declare const process: any;

function resolveApiBaseUrl(): string {
  const envUrl = (typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_API_BASE_URL : undefined)?.trim();

  // In production (HTTPS domain), always use the explicit environment URL
  if (envUrl && envUrl.startsWith('https://')) {
    return envUrl;
  }

  // Extract Metro bundler host IP (e.g. "192.168.1.12:8081" -> "192.168.1.12")
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any)?.manifest?.debuggerHost ||
    (Constants as any)?.expoGoConfig?.debuggerHost;

  // In development, send API traffic through Metro. This uses the port the
  // phone already reached to load the app, avoiding a separate firewall rule
  // for the Node API's port.
  if (__DEV__) {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return window.location.origin;
    }
    if (typeof hostUri === 'string' && hostUri) {
      try {
        const parsedHost = new URL(hostUri.includes('://') ? hostUri : `http://${hostUri}`);
        return `http://${parsedHost.hostname}:${parsedHost.port || '8081'}`;
      } catch {
        // Fall through to the platform-specific development address.
      }
    }
    if (Platform.OS === 'android') return 'http://10.0.2.2:8081';
    return 'http://localhost:8081';
  }

  const port = envUrl?.match(/:(\d+)/)?.[1] || '4000';

  // On Web, use the host that served Expo. On a phone, localhost would mean
  // the phone itself rather than the computer running the Node API.
  if (Platform.OS === 'web') {
    const webHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `http://${webHost || 'localhost'}:${port}`;
  }

  // On a physical phone running via Expo Go / local network:
  // The phone reached the computer via metroHost, so the API server is on the exact same host.
  const metroHost = typeof hostUri === 'string' ? hostUri.split(':')[0] : undefined;
  if (metroHost && metroHost !== 'localhost' && metroHost !== '127.0.0.1' && metroHost !== '10.0.2.2') {
    return `http://${metroHost}:${port}`;
  }

  // If envUrl has an explicit non-localhost IP (e.g. manual LAN IP configuration)
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1') && !envUrl.includes('10.0.2.2')) {
    return envUrl;
  }

  // Android emulator fallback
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${port}`;
  }

  // Default to localhost
  return `http://localhost:${port}`;
}

/** API host is configured through the Expo public environment with automatic device fallback. */
export const APP_CONFIG = {
  get apiBaseUrl(): string {
    return resolveApiBaseUrl();
  },
  appUrl: (typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_APP_URL : undefined)?.trim().replace(/\/$/, '') || 'http://localhost:8081',
  apiTimeout: 10000,
  appVersion: '1.0.0',
} as const;
