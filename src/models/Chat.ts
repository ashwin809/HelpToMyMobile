export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  text: string;
  createdAt: string;
  isRead: boolean;
}

export interface ChatThread {
  id: string;
  participants: string[]; // User IDs
  lastMessage?: ChatMessage;
  updatedAt: string;
}
