import { collection, addDoc, onSnapshot, query, where, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { AppNotification } from '../models';

export const notificationService = {
  // Create a notification
  async createNotification(notification: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) {
    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
      ...notification,
      isRead: false,
      createdAt: serverTimestamp(),
    });
  },

  // Subscribe to user notifications
  subscribeToUserNotifications(
    userId: string,
    callback: (notifications: AppNotification[]) => void,
    onError?: (error: Error) => void,
  ) {
    const notificationsRef = collection(db, 'notifications');
    // Sort locally to avoid a composite index requirement for this query.
    const q = query(notificationsRef, where('userId', '==', userId));

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        } as AppNotification;
      }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      callback(notifications);
    }, onError);
  },

  // Mark a notification as read
  async markAsRead(notificationId: string) {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      isRead: true,
    });
  },

  // Mark all notifications as read for a user
  // Requires fetching them first or using a batch write if there are many.
};
