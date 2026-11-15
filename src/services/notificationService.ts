import { apiClient } from '../api/apiClient';
import { AppNotification } from '../models';

export const notificationService = {
  subscribeToUserNotifications(
    _userId: string,
    callback: (notifications: AppNotification[]) => void,
    onError?: (error: Error) => void,
  ) {
    let active = true;
    const refresh = async () => {
      try {
        const { data } = await apiClient.get<{ items: AppNotification[] }>('/api/v1/notifications');
        if (active) callback(data.items);
      } catch (error) {
        if (active) onError?.(error instanceof Error ? error : new Error('Could not refresh notifications.'));
      }
    };
    void refresh();
    const timer = setInterval(() => { void refresh(); }, 10_000);
    return () => { active = false; clearInterval(timer); };
  },

  async markAsRead(notificationId: string) {
    await apiClient.patch(`/api/v1/notifications/${encodeURIComponent(notificationId)}/read`);
  },
};
