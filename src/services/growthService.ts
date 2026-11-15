import { apiClient } from '../api/apiClient';
import { CirclePost, LearningGoal, OfficeHour, Opportunity, StudyCircle, StudyResource } from '../models';

async function items<T>(path: string): Promise<T[]> {
  const { data } = await apiClient.get<{ items: T[] }>(path);
  return data.items;
}

export const growthService = {
  listCircles: () => items<StudyCircle>('/api/v1/study-circles'),
  createCircle: async (input: { name: string; topic: string; description: string }) => {
    const { data } = await apiClient.post<{ item: StudyCircle }>('/api/v1/study-circles', input);
    return data.item;
  },
  joinCircle: (circleId: string) => apiClient.post(`/api/v1/study-circles/${encodeURIComponent(circleId)}/join`),
  listCirclePosts: (circleId: string) => items<CirclePost>(`/api/v1/study-circles/${encodeURIComponent(circleId)}/posts`),
  createCirclePost: async (circleId: string, content: string) => {
    const { data } = await apiClient.post<{ item: CirclePost }>(`/api/v1/study-circles/${encodeURIComponent(circleId)}/posts`, { content });
    return data.item;
  },
  listOfficeHours: () => items<OfficeHour>('/api/v1/office-hours'),
  createOfficeHour: async (input: { title: string; startsAt: string; endsAt: string; meetingUrl?: string }) => {
    const { data } = await apiClient.post<{ item: OfficeHour }>('/api/v1/office-hours', input);
    return data.item;
  },
  bookOfficeHour: (slotId: string, note?: string) => apiClient.post(`/api/v1/office-hours/${encodeURIComponent(slotId)}/book`, { note }),
  updateOfficeHourBooking: (bookingId: string, status: 'accepted' | 'declined' | 'cancelled') => apiClient.patch(`/api/v1/office-hour-bookings/${encodeURIComponent(bookingId)}`, { status }),
  listOpportunities: () => items<Opportunity>('/api/v1/opportunities'),
  createOpportunity: async (input: { title: string; organization: string; kind: Opportunity['kind']; description: string; eligibility?: string; deadline?: string; applyUrl?: string }) => {
    const { data } = await apiClient.post<{ item: Opportunity }>('/api/v1/opportunities', input);
    return data.item;
  },
  toggleOpportunitySave: async (opportunityId: string) => {
    const { data } = await apiClient.post<{ saved: boolean }>(`/api/v1/opportunities/${encodeURIComponent(opportunityId)}/save`);
    return data.saved;
  },
  listGoals: () => items<LearningGoal>('/api/v1/goals'),
  createGoal: async (input: { title: string; category: string; dueDate?: string | null }) => {
    const { data } = await apiClient.post<{ item: LearningGoal }>('/api/v1/goals', input);
    return data.item;
  },
  updateGoal: async (goalId: string, input: Partial<Pick<LearningGoal, 'title' | 'category' | 'dueDate' | 'progress'>>) => {
    const { data } = await apiClient.patch<{ item: LearningGoal }>(`/api/v1/goals/${encodeURIComponent(goalId)}`, input);
    return data.item;
  },
  deleteGoal: (goalId: string) => apiClient.delete(`/api/v1/goals/${encodeURIComponent(goalId)}`),
  listResources: () => items<StudyResource>('/api/v1/resources'),
  createResource: async (input: { title: string; description: string; category: string; url: string }) => {
    const { data } = await apiClient.post<{ item: StudyResource }>('/api/v1/resources', input);
    return data.item;
  },
  acceptAnswer: (requestId: string, responseId: string) => apiClient.post(`/api/v1/community/questions/${encodeURIComponent(requestId)}/responses/${encodeURIComponent(responseId)}/accept`, {}),
};
