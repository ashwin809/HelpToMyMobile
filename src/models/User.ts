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
  userTypes?: UserRole[];
  mutualConnections?: number;
  isRegionalLead?: boolean;
  university?: string;
  department?: string;
  designation?: string;
  educationLevel?: string;
  skills?: string[];
  bio?: string;
  avatarUrl?: string;
  isVerified?: boolean;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  country?: string;
  postCode?: string;
  phone?: string;
  mobile?: string;
  allowConnectionRequests?: boolean;
  createdAt: string;
  profileSetupStep?: number;
  profileSetupComplete?: boolean;
}

export type ProfileUpdate = Omit<Partial<User>, 'avatarUrl' | 'university' | 'department' | 'designation' | 'bio'> & {
  avatarUrl?: string | null;
  university?: string | null;
  department?: string | null;
  designation?: string | null;
  bio?: string | null;
};

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
}

