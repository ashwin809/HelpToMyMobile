import { apiClient, getStoredApiToken, saveApiToken } from '../api/apiClient';
import { LoginCredentials, ProfileUpdate, RegisterPayload, User } from '../models';
import { APP_CONFIG } from '../constants/config';

type AuthResponse = { user: User; token: string };

export function getAuthErrorMessage(error: unknown): string {
  const apiMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
  if (apiMessage) return apiMessage;
  const code = (error as { code?: string })?.code;
  const message = error instanceof Error ? error.message : '';
  if (code === 'ERR_NETWORK' || code === 'ECONNABORTED' || code === 'ETIMEDOUT' || message.toLowerCase() === 'network error') {
    const apiAddress = APP_CONFIG.apiBaseUrl;
    if (!apiAddress) return 'The account server address is missing. Set EXPO_PUBLIC_API_BASE_URL in .env, then restart Expo.';
    return `Cannot reach the account server at ${apiAddress}. Make sure the API is running. If you are using a phone, connect it to the same Wi-Fi as this computer, then restart Expo.`;
  }
  return message || 'Authentication failed. Please try again.';
}

export const authService = {
  async initialize(): Promise<User | null> {
    if (!(await getStoredApiToken())) return null;
    try {
      const { data } = await apiClient.get<{ user: User }>('/api/v1/auth/me', { timeout: 3500 });
      return data.user;
    } catch (error) {
      if ((error as { response?: { status?: number } })?.response?.status === 401) {
        await saveApiToken(null);
      }
      return null;
    }
  },

  async login(credentials: LoginCredentials): Promise<User> {
    const { data } = await apiClient.post<AuthResponse>('/api/v1/auth/login', {
      ...credentials,
      email: credentials.email.trim(),
    });
    await saveApiToken(data.token);
    return data.user;
  },

  async register(payload: RegisterPayload): Promise<User> {
    if (!payload.password) throw new Error('Password is required.');
    const { data } = await apiClient.post<AuthResponse>('/api/v1/auth/register', {
      ...payload,
      email: payload.email.trim(),
    });
    await saveApiToken(data.token);
    return data.user;
  },

  async forgotPassword(_email: string): Promise<{ success: boolean; message: string }> {
    const { data } = await apiClient.post<{ success: boolean; message: string }>(
      '/api/v1/auth/forgot-password',
      { email: _email.trim() },
    );
    return data;
  },

  async resetPassword(token: string, password: string): Promise<{ success: boolean; message: string }> {
    const { data } = await apiClient.post<{ success: boolean; message: string }>(
      '/api/v1/auth/reset-password',
      { token, password },
    );
    return data;
  },

  async updateProfile(userId: string, updates: ProfileUpdate): Promise<User> {
    const { id: _id, email: _email, createdAt: _createdAt, isVerified: _verified, ...safeUpdates } = updates;
    const { data } = await apiClient.patch<{ user: User }>('/api/v1/profile', safeUpdates);
    if (data.user.id !== userId) throw new Error('The server returned an unexpected profile.');
    return data.user;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/v1/auth/logout');
    } finally {
      await saveApiToken(null);
    }
  },
};
