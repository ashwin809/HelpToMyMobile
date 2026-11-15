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
  otherParticipantId?: string;
  otherParticipantName?: string;
  lastMessage?: ChatMessage;
  updatedAt: string;
  unreadCount?: number;
}
