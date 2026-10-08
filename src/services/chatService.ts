import { collection, doc, addDoc, onSnapshot, query, where, orderBy, getDocs, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { ChatMessage, ChatThread } from '../models';

async function assertNotBlocked(firstUserId: string, secondUserId: string) {
  const block = await getDoc(doc(db, 'users', firstUserId, 'blockedUsers', encodeURIComponent(secondUserId)));
  if (block.exists()) throw new Error('You blocked this user. Unblock them to start a conversation.');
}

export const chatService = {
  // Create or get an existing thread between two users
  async createOrGetThread(participant1Id: string, participant2Id: string): Promise<string> {
    await assertNotBlocked(participant1Id, participant2Id);
    const threadsRef = collection(db, 'chatThreads');
    
    // Simplification for two-person chat: query threads where participants array contains participant1Id
    // In a real app, you'd need a more robust way to find exact matches for participants
    const q = query(threadsRef, where('participants', 'array-contains', participant1Id));
    const snapshot = await getDocs(q);
    
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data() as ChatThread;
      if (data.participants.includes(participant2Id)) {
        return docSnapshot.id;
      }
    }

    // Thread doesn't exist, create it
    const newThreadRef = await addDoc(threadsRef, {
      participants: [participant1Id, participant2Id],
      updatedAt: serverTimestamp(),
    });
    
    return newThreadRef.id;
  },

  // Send a message
  async sendMessage(threadId: string, senderId: string, text: string): Promise<void> {
    const threadSnapshot = await getDoc(doc(db, 'chatThreads', threadId));
    if (!threadSnapshot.exists()) throw new Error('This conversation no longer exists.');
    const participants = (threadSnapshot.data() as ChatThread).participants;
    const otherParticipantId = participants.find((participantId) => participantId !== senderId);
    if (!otherParticipantId) throw new Error('You are not a participant in this conversation.');
    await assertNotBlocked(senderId, otherParticipantId);

    const messagesRef = collection(db, `chatThreads/${threadId}/messages`);
    
    const message = {
      threadId,
      senderId,
      text,
      createdAt: serverTimestamp(),
      isRead: false,
    };
    
    await addDoc(messagesRef, message);
    
    // Update the thread's last message and updatedAt
    const threadRef = doc(db, 'chatThreads', threadId);
    await updateDoc(threadRef, {
      lastMessage: message,
      updatedAt: serverTimestamp(),
    });
  },

  // Subscribe to messages in a thread
  subscribeToMessages(threadId: string, callback: (messages: ChatMessage[]) => void, onError?: (error: Error) => void) {
    const messagesRef = collection(db, `chatThreads/${threadId}/messages`);
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Handle Firestore timestamp conversion
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        } as ChatMessage;
      });
      callback(messages);
    }, onError);
  },

  // Subscribe to user's threads
  subscribeToUserThreads(userId: string, callback: (threads: ChatThread[]) => void, onError?: (error: Error) => void) {
    const threadsRef = collection(db, 'chatThreads');
    // Sort locally to avoid requiring a composite Firestore index for this query.
    const q = query(threadsRef, where('participants', 'array-contains', userId));
    
    return onSnapshot(q, (snapshot) => {
      const threads = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        } as ChatThread;
      }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      callback(threads);
    }, onError);
  },
  
  // Mark message as read
  async markMessageAsRead(threadId: string, messageId: string) {
    const messageRef = doc(db, `chatThreads/${threadId}/messages`, messageId);
    await updateDoc(messageRef, {
      isRead: true
    });
  }
};
