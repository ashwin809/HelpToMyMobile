import { apiClient } from '../api/apiClient';

export interface GoogleCalendarStatus {
  configured: boolean;
  connected: boolean;
}

export const googleCalendarService = {
  async getStatus(): Promise<GoogleCalendarStatus> {
    const { data } = await apiClient.get<GoogleCalendarStatus>('/api/v1/calendar/google/status');
    return data;
  },

  async startConnection(): Promise<string> {
    const { data } = await apiClient.post<{ authorizationUrl: string }>('/api/v1/calendar/google/connect');
    return data.authorizationUrl;
  },

  async disconnect(): Promise<void> {
    await apiClient.delete('/api/v1/calendar/google/connection');
  },

  async addAppointment(bookingId: string): Promise<{ eventUrl: string | null; alreadyAdded: boolean }> {
    const { data } = await apiClient.post<{ eventUrl: string | null; alreadyAdded: boolean }>(
      '/api/v1/calendar/google/events',
      { bookingId },
    );
    return data;
  },
};
