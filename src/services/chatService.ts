import { apiClient } from '../api/apiClient';
import { ChatMessage, ChatThread } from '../models';

const POLL_INTERVAL_MS = 4000;

function subscribe<T>(load: () => Promise<T>, callback: (value: T) => void, onError?: (error: Error) => void) {
  let active = true;
  const refresh = async () => {
    try {
      const value = await load();
      if (active) callback(value);
    } catch (error) {
      if (active) onError?.(error instanceof Error ? error : new Error('Could not refresh chat.'));
    }
  };
  void refresh();
  const timer = setInterval(() => { void refresh(); }, POLL_INTERVAL_MS);
  return () => { active = false; clearInterval(timer); };
}

export const chatService = {
  async createOrGetThread(_participant1Id: string, participant2Id: string): Promise<string> {
    const { data } = await apiClient.post<{ item: { id: string } }>('/api/v1/chat/threads', { otherUserId: participant2Id });
    return data.item.id;
  },

  async sendMessage(threadId: string, _senderId: string, text: string): Promise<void> {
    await apiClient.post(`/api/v1/chat/threads/${encodeURIComponent(threadId)}/messages`, { text });
  },

  subscribeToMessages(threadId: string, callback: (messages: ChatMessage[]) => void, onError?: (error: Error) => void) {
    return subscribe(async () => {
      const { data } = await apiClient.get<{ items: ChatMessage[] }>(`/api/v1/chat/threads/${encodeURIComponent(threadId)}/messages`);
      return data.items;
    }, callback, onError);
  },

  subscribeToUserThreads(_userId: string, callback: (threads: ChatThread[]) => void, onError?: (error: Error) => void) {
    return subscribe(async () => {
      const { data } = await apiClient.get<{ items: ChatThread[] }>('/api/v1/chat/threads');
      return data.items;
    }, callback, onError);
  },

  async markMessageAsRead(threadId: string, messageId: string) {
    await apiClient.patch(`/api/v1/chat/threads/${encodeURIComponent(threadId)}/messages/${encodeURIComponent(messageId)}/read`);
  },
};
