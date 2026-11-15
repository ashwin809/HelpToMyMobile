export interface StudyCircle {
  id: string;
  name: string;
  topic: string;
  description: string;
  university?: string;
  isDemo: boolean;
  createdAt: string;
  memberCount: number;
  isMember: boolean;
}

export interface CirclePost {
  id: string;
  circleId: string;
  authorId: string;
  firstName?: string;
  lastName?: string;
  userType?: string;
  content: string;
  createdAt: string;
}

export interface OfficeHour {
  id: string;
  mentorId: string;
  firstName?: string;
  lastName?: string;
  userType?: string;
  designation?: string;
  university?: string;
  avatarUrl?: string;
  title: string;
  startsAt: string;
  endsAt: string;
  meetingUrl?: string;
  isDemo: boolean;
  isBooked: boolean;
  canRequest?: boolean;
  bookingStatus?: 'requested' | 'accepted' | 'declined' | 'cancelled';
  bookingId?: string;
  bookingNote?: string;
  googleEventUrl?: string;
  bookerFirstName?: string;
  bookerLastName?: string;
  isMine: boolean;
}

export type OpportunityKind = 'Scholarship' | 'Internship' | 'Research' | 'Competition' | 'Other';
export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  kind: OpportunityKind;
  description: string;
  eligibility?: string;
  deadline?: string;
  applyUrl?: string;
  university?: string;
  isDemo: boolean;
  isSaved: boolean;
}

export interface LearningGoal {
  id: string;
  title: string;
  category: string;
  dueDate?: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudyResource {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
  university?: string;
  isDemo: boolean;
  createdAt: string;
}
