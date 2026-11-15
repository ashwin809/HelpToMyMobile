import { apiClient } from '../api/apiClient';

type BlockedAccount = { id: string; targetUserId: string; targetName: string };

export const reportBlockService = {
  async getBlockedUsers(_userId: string): Promise<BlockedAccount[]> {
    const { data } = await apiClient.get<{ items: { targetUserId: string; targetName: string }[] }>('/api/v1/blocks');
    return data.items.map((item) => ({ ...item, id: item.targetUserId }));
  },

  async getBlockedUserIds(_userId: string): Promise<Set<string>> {
    return new Set((await this.getBlockedUsers(_userId)).map((user) => user.targetUserId));
  },

  async blockUser(_userId: string, targetUserId: string, _targetName: string): Promise<void> {
    await apiClient.post('/api/v1/blocks', { targetUserId });
  },

  async unblockUser(_userId: string, targetUserId: string): Promise<void> {
    await apiClient.delete(`/api/v1/blocks/${encodeURIComponent(targetUserId)}`);
  },

  async reportUser(input: {
    reporterId: string;
    targetUserId: string;
    targetName: string;
    reason: string;
    contentType?: 'profile' | 'help_request';
    contentId?: string;
  }): Promise<void> {
    const { reporterId: _reporterId, targetName: _targetName, ...report } = input;
    await apiClient.post('/api/v1/reports', report);
  },
};
