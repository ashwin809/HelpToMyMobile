import { UserRole } from '../models';

export type SelectableUserRole = Exclude<UserRole, 'Applicant'>;

export const PROFILE_ROLE_OPTIONS: {
  role: SelectableUserRole;
  label: string;
  description: string;
}[] = [
  { role: 'Student', label: 'Student / Aspirant', description: 'Get help with admissions, exams, tutoring, and study.' },
  { role: 'Professor', label: 'Professor / Faculty', description: 'Share academic guidance and support student learning.' },
  { role: 'Alumni', label: 'Alumni / Mentor', description: 'Guide students using your education and career experience.' },
  { role: 'Sponsor', label: 'Sponsor / Donor', description: 'Support students and approved education opportunities.' },
  { role: 'Volunteer', label: 'Volunteer', description: 'Help coordinate activities and support the community.' },
];
