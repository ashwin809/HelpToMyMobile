export type UserRole =
  | 'Student'
  | 'Professor'
  | 'Alumni'
  | 'Sponsor'
  | 'Volunteer'
  | 'Applicant';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: UserRole;
  isRegionalLead?: boolean;
  university?: string;
  department?: string;
  designation?: string;
  educationLevel?: string;
  skills?: string[];
  bio?: string;
  avatarUrl?: string;
  isVerified?: boolean;
  helpedCount?: number;
  rating?: number;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  country?: string;
  postCode?: string;
  phone?: string;
  mobile?: string;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  userType: UserRole;
  university?: string;
  department?: string;
  designation?: string;
  educationLevel?: string;
  skills?: string[];
  bio?: string;
  isRegionalLead?: boolean;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  country?: string;
  postCode?: string;
  phone?: string;
  mobile?: string;
}

