export interface ContactMessagePayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactMessage extends ContactMessagePayload {
  id: string;
  submittedAt: string;
  status: 'Received' | 'In Review' | 'Responded';
}
