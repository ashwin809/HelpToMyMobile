import { apiClient } from '../api/apiClient';
import { ContactMessage, ContactMessagePayload } from '../models';

export const contactService = {
  async submitMessage(payload: ContactMessagePayload): Promise<ContactMessage> {
    const { data } = await apiClient.post<{ item: ContactMessage }>('/api/v1/contact-messages', payload);
    return data.item;
  },
};
