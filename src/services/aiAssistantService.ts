import { apiClient } from '../api/apiClient';

export type AssistantHistoryMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export const aiAssistantService = {
  async ask(message: string, history: AssistantHistoryMessage[] = []): Promise<string> {
    const { data } = await apiClient.post<{ reply: string }>(
      '/api/v1/ai/assistant',
      { message, history },
      { timeout: 40_000 },
    );
    return data.reply;
  },
};
