declare const process: any;

/** API host is intentionally unset until the site owner supplies a supported mobile API. */
export const APP_CONFIG = {
  apiBaseUrl: (typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_API_BASE_URL : undefined)?.trim() || undefined,
  apiTimeout: 15000,
  appVersion: '1.0.0',
} as const;
