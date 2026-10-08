import axios from 'axios';
import { APP_CONFIG } from '../constants/config';

export const apiClient = axios.create({
  ...(APP_CONFIG.apiBaseUrl ? { baseURL: APP_CONFIG.apiBaseUrl } : {}),
  timeout: APP_CONFIG.apiTimeout,
  headers: { Accept: 'application/json' },
});

export class BackendApiRequiredError extends Error {
  constructor(action: string) {
    super(`TODO: BACKEND/API REQUIRED — ${action}. The audited website exposes ASP.NET Web Forms postbacks, not a confirmed mobile API.`);
    this.name = 'BackendApiRequiredError';
  }
}

export function requireConfiguredApi(action: string): never {
  throw new BackendApiRequiredError(action);
}
