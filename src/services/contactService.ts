import { ContactMessage, ContactMessagePayload } from '../models';
import { requireConfiguredApi } from '../api/apiClient';

export const contactService = {
  async submitMessage(_payload: ContactMessagePayload): Promise<ContactMessage> {
    return requireConfiguredApi('contact message submission endpoint');
  },
};
