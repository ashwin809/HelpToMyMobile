import { UserRole } from './User';

export type HelpCategory =
  | 'Admissions'
  | 'Research'
  | 'Syllabus & Exam'
  | 'Scholarships'
  | 'Career Guidance'
  | 'General Help';

export type HelpStatus = 'open' | 'in_progress' | 'resolved';

export interface HelpResponse {
  id: string;
  requestId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorUniversity?: string;
  authorDesignation?: string;
  content: string;
  createdAt: string;
  isAccepted?: boolean;
  upvotes: number;
}

export interface HelpRequest {
  id: string;
  title: string;
  description: string;
  category: HelpCategory;
  university: string;
  department?: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorUniversity?: string;
  authorDesignation?: string;
  urgency: 'Low' | 'Medium' | 'High';
  status: HelpStatus;
  createdAt: string;
  responseCount: number;
  upvotes: number;
  tags: string[];
  responses?: HelpResponse[];
}

export interface Institution {
  id: string;
  name: string;
  location: string;
  type: 'University' | 'College' | 'Institute';
  departments: string[];
  mentorCount: number;
  studentCount: number;
}

export interface Connection {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  message?: string;
}
