import { apiClient } from '../api/apiClient';

export interface ActivitySummary {
  unreadMessages: number;
  messagesSent: number;
  repliesGiven: number;
  repliesReceived: number;
  questionsAsked: number;
  unreadNotifications: number;
}

const emptySummary: ActivitySummary = {
  unreadMessages: 0,
  messagesSent: 0,
  repliesGiven: 0,
  repliesReceived: 0,
  questionsAsked: 0,
  unreadNotifications: 0,
};

export const activityService = {
  async getSummary(): Promise<ActivitySummary> {
    const { data } = await apiClient.get<ActivitySummary>('/api/v1/activity/summary');
    return { ...emptySummary, ...data };
  },
};
