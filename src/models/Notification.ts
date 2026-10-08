export type NotificationType = 'HELP_REQUEST' | 'MESSAGE' | 'SYSTEM' | 'CONNECTION';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  relatedId?: string; // ID of the related entity (e.g., helpRequestId, messageId)
  isRead: boolean;
  createdAt: string;
}
