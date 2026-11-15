import { apiClient } from '../api/apiClient';
import { Connection, User } from '../models';

export const mentorService = {
  async getMentors(filters: { university?: string; role?: string; search?: string }): Promise<User[]> {
    const { data } = await apiClient.get<{ items: User[] }>('/api/v1/mentors', {
      params: { university: filters.university, role: filters.role, search: filters.search, limit: 100 },
    });
    return data.items;
  },

  async getConnections(): Promise<Connection[]> {
    const { data } = await apiClient.get<{ items: Connection[] }>('/api/v1/connections');
    return data.items;
  },

  async connectWithUser(targetUserId: string, message: string): Promise<Connection> {
    const { data } = await apiClient.post<{ item: Connection }>('/api/v1/connections', {
      otherUserId: targetUserId, message,
    });
    return data.item;
  },

  async updateConnection(connectionId: string, status: 'accepted' | 'declined' | 'cancelled'): Promise<Connection> {
    const { data } = await apiClient.patch<{ item: Connection }>(`/api/v1/connections/${encodeURIComponent(connectionId)}`, { status });
    return data.item;
  },
};
