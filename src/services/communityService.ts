import { apiClient } from '../api/apiClient';
import { HelpCategory, HelpRequest, HelpResponse, HelpStatus, User } from '../models';

type RequestFilters = {
  university?: string;
  category?: string;
  query?: string;
  authorId?: string;
  status?: string;
};

function apiError(error: unknown, fallback: string): Error {
  const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
  return new Error(message || (error instanceof Error ? error.message : fallback));
}

export const communityService = {
  async getCommunityImpact(): Promise<{ responsesGiven: number; resolvedInquiriesHelped: number }> {
    try {
      const { data } = await apiClient.get<{ responsesGiven: number; resolvedInquiriesHelped: number }>('/api/v1/community/impact');
      return data;
    } catch (error) {
      throw apiError(error, 'Could not load community impact.');
    }
  },

  async getHelpRequests(filters?: RequestFilters): Promise<HelpRequest[]> {
    try {
      const { data } = await apiClient.get<{ items: HelpRequest[] }>('/api/v1/community/questions', {
        params: {
          limit: 50,
          authorId: filters?.authorId,
          category: filters?.category,
          university: filters?.university,
          search: filters?.query,
          status: filters?.status,
        },
      });
      return data.items;
    } catch (error) {
      throw apiError(error, 'Could not load community questions.');
    }
  },

  async getHelpRequestById(requestId: string): Promise<HelpRequest | null> {
    try {
      const { data } = await apiClient.get<{ item: HelpRequest }>(`/api/v1/community/questions/${encodeURIComponent(requestId)}`);
      return data.item;
    } catch (error) {
      if ((error as { response?: { status?: number } })?.response?.status === 404) return null;
      throw apiError(error, 'Could not load this question.');
    }
  },

  async createHelpRequest(payload: {
    title: string;
    description: string;
    category: HelpCategory;
    university: string;
    department?: string;
    urgency?: 'Low' | 'Medium' | 'High';
    tags?: string[];
    author: User;
  }): Promise<HelpRequest> {
    try {
      const { author: _author, ...request } = payload;
      const { data } = await apiClient.post<{ item: HelpRequest }>('/api/v1/community/questions', request);
      return data.item;
    } catch (error) {
      throw apiError(error, 'Could not publish this question.');
    }
  },

  async addResponseToRequest(payload: {
    requestId: string;
    content: string;
    author: User;
  }): Promise<HelpResponse> {
    try {
      const { data } = await apiClient.post<{ item: HelpResponse }>(
        `/api/v1/community/questions/${encodeURIComponent(payload.requestId)}/responses`,
        { content: payload.content },
      );
      return data.item;
    } catch (error) {
      throw apiError(error, 'Could not post your reply.');
    }
  },

  async toggleUpvoteRequest(requestId: string, _userId: string): Promise<number> {
    try {
      const { data } = await apiClient.post<{ upvotes: number }>(
        `/api/v1/community/questions/${encodeURIComponent(requestId)}/vote`,
      );
      return data.upvotes;
    } catch (error) {
      throw apiError(error, 'Could not update your vote.');
    }
  },

  async updateRequestStatus(requestId: string, status: HelpStatus): Promise<void> {
    if (status !== 'resolved') throw new Error('Only the question author can mark a question as resolved.');
    try {
      await apiClient.post(`/api/v1/community/questions/${encodeURIComponent(requestId)}/resolve`);
    } catch (error) {
      throw apiError(error, 'Could not resolve this question.');
    }
  },
};
