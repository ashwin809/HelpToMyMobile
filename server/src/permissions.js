import { pool } from './db.js';

export const PLATFORM_ROLES = ['Student', 'Applicant', 'Professor', 'Alumni', 'Sponsor', 'Volunteer'];
export const LEARNER_ROLES = ['Student', 'Applicant'];
export const MENTOR_ROLES = ['Professor', 'Alumni'];

/** Check the union of a user's selected roles so multi-role accounts work naturally. */
export async function requireAnyRole(req, res, allowedRoles, action) {
  const result = await pool.query('SELECT user_roles,user_type FROM users WHERE id=$1', [req.userId]);
  if (!result.rowCount) {
    res.status(401).json({ error: 'Account no longer exists.' });
    return false;
  }
  const roles = result.rows[0].user_roles?.length ? result.rows[0].user_roles : [result.rows[0].user_type];
  if (roles.some((role) => allowedRoles.includes(role))) return true;
  res.status(403).json({ error: `Your selected role does not have permission to ${action}.` });
  return false;
}
