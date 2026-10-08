import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebaseConfig';

const blockedUsersRef = (userId: string) => collection(db, 'users', userId, 'blockedUsers');
const blockedUserRef = (userId: string, targetUserId: string) =>
  doc(blockedUsersRef(userId), encodeURIComponent(targetUserId));

export const reportBlockService = {
  async getBlockedUsers(userId: string): Promise<{ id: string; targetUserId: string; targetName: string }[]> {
    const snapshot = await getDocs(blockedUsersRef(userId));
    return snapshot.docs.map((blocked) => ({
      id: blocked.id,
      targetUserId: blocked.data().targetUserId as string,
      targetName: blocked.data().targetName as string,
    }));
  },

  async getBlockedUserIds(userId: string): Promise<Set<string>> {
    const snapshot = await getDocs(blockedUsersRef(userId));
    const users = snapshot.docs.map((blocked) => blocked.data().targetUserId as string);
    return new Set(users.filter(Boolean));
  },

  async blockUser(userId: string, targetUserId: string, targetName: string): Promise<void> {
    if (!userId || !targetUserId || userId === targetUserId) throw new Error('You cannot block this account.');
    await setDoc(blockedUserRef(userId, targetUserId), {
      targetUserId,
      targetName,
      createdAt: serverTimestamp(),
    });
  },

  async unblockUser(userId: string, targetUserId: string): Promise<void> {
    await deleteDoc(blockedUserRef(userId, targetUserId));
  },

  async reportUser(input: {
    reporterId: string;
    targetUserId: string;
    targetName: string;
    reason: string;
    contentType?: 'profile' | 'help_request';
    contentId?: string;
  }): Promise<void> {
    if (!input.reporterId || !input.targetUserId || input.reporterId === input.targetUserId) {
      throw new Error('You cannot report this account.');
    }
    await addDoc(collection(db, 'reports'), {
      ...input,
      status: 'open',
      createdAt: serverTimestamp(),
    });
  },
};
