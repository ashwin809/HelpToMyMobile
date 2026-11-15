import { User, UserRole } from '../models';

export const LEARNER_ROLES: UserRole[] = ['Student', 'Applicant'];
export const MENTOR_ROLES: UserRole[] = ['Professor', 'Alumni'];

export function hasAnyRole(user: User | null | undefined, roles: UserRole[]): boolean {
  const selectedRoles = user?.userTypes?.length ? user.userTypes : user?.userType ? [user.userType] : [];
  return selectedRoles.some((role) => roles.includes(role));
}
