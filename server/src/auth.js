import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { pool } from './db.js';
import { isMailConfigured, sendPasswordResetEmail } from './mailer.js';

const roles = ['Student', 'Professor', 'Alumni', 'Sponsor', 'Volunteer', 'Applicant'];
const userRoleSchema = z.enum(roles);
const passwordSchema = z.string().min(8).max(128);
const resetRequestSchema = z.object({ email: z.email().max(255) });
const resetPasswordSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/i),
  password: passwordSchema,
});
const registerSchema = z.object({
  email: z.preprocess((value) => typeof value === 'string' ? value.trim().toLowerCase() : value, z.email().max(255)),
  password: passwordSchema,
}).strict();

const profileFields = {
  firstName: 'first_name', lastName: 'last_name', userType: 'user_type', userTypes: 'user_roles',
  university: 'university', department: 'department', designation: 'designation',
  educationLevel: 'education_level', skills: 'skills', bio: 'bio', avatarUrl: 'avatar_url',
  isRegionalLead: 'is_regional_lead', address1: 'address1', address2: 'address2',
  city: 'city', state: 'state', country: 'country', postCode: 'post_code',
  phone: 'phone', mobile: 'mobile',
  allowConnectionRequests: 'allow_connection_requests',
  profileSetupStep: 'profile_setup_step', profileSetupComplete: 'profile_setup_complete',
};

export function publicUser(row) {
  return {
    id: row.id, email: row.email, firstName: row.first_name, lastName: row.last_name,
    userType: row.user_type, userTypes: row.user_roles?.length ? row.user_roles : [row.user_type], isRegionalLead: row.is_regional_lead,
    university: row.university ?? undefined, department: row.department ?? undefined,
    designation: row.designation ?? undefined, educationLevel: row.education_level ?? undefined,
    skills: row.skills ?? [], bio: row.bio ?? undefined, avatarUrl: row.avatar_url ?? undefined,
    isVerified: row.is_verified, address1: row.address1 ?? undefined,
    address2: row.address2 ?? undefined, city: row.city ?? undefined,
    state: row.state ?? undefined, country: row.country ?? undefined,
    postCode: row.post_code ?? undefined, phone: row.phone ?? undefined,
    mobile: row.mobile ?? undefined, createdAt: row.created_at.toISOString(),
    allowConnectionRequests: row.allow_connection_requests ?? true,
    profileSetupStep: row.profile_setup_step ?? 3, profileSetupComplete: row.profile_setup_complete ?? true,
  };
}

async function createToken(userId, database = pool) {
  const sessionId = randomUUID();
  await database.query(
    `INSERT INTO auth_sessions (id, user_id, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
    [sessionId, userId],
  );
  return jwt.sign({}, process.env.JWT_SECRET, {
    subject: userId,
    jwtid: sessionId,
    issuer: 'helptoyou-api',
    audience: 'helptoyou-app',
    expiresIn: '7d',
  });
}

export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return res.status(401).json({ error: 'Authentication required.' });
  let claims;
  try {
    claims = jwt.verify(token, process.env.JWT_SECRET, { issuer: 'helptoyou-api', audience: 'helptoyou-app' });
  } catch {
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
  const session = await pool.query(
    'SELECT id FROM auth_sessions WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL AND expires_at > NOW()',
    [claims.jti, claims.sub],
  );
  if (!session.rowCount) return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  req.userId = claims.sub;
  req.sessionId = claims.jti;
  return next();
}

export async function register(req, res) {
  const parsed = registerSchema.parse(req.body);
  const input = {
    ...parsed,
    firstName: '',
    lastName: '',
    userType: 'Student',
    userTypes: ['Student'],
  };
  const email = input.email;
  const passwordHash = await bcrypt.hash(input.password, 12);
  const client = await pool.connect();
  let user;
  let token;
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO users (
        id, email, password_hash, first_name, last_name, user_type, user_roles, university, department,
        designation, education_level, skills, bio, is_regional_lead, address1, address2,
        city, state, country, post_code, phone, mobile, profile_setup_step, profile_setup_complete
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,1,FALSE)
      RETURNING *`,
      [randomUUID(), email, passwordHash, input.firstName || '', input.lastName || '', input.userType || 'Student',
        input.userTypes, input.university || null, input.department || null, input.designation || null,
        input.educationLevel || null, input.skills || [], input.bio || null,
        false, input.address1 || null, input.address2 || null,
        input.city || null, input.state || null, input.country || null,
        input.postCode || null, input.phone || null, input.mobile || null],
    );
    user = publicUser(result.rows[0]);
    token = await createToken(user.id, client);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
  return res.status(201).json({ user, token });
}

export async function login(req, res) {
  const input = z.object({ email: z.email().max(255), password: passwordSchema }).parse(req.body);
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [input.email.trim().toLowerCase()]);
  const row = result.rows[0];
  if (!row || !(await bcrypt.compare(input.password, row.password_hash))) {
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  }
  return res.json({ user: publicUser(row), token: await createToken(row.id) });
}

export async function requestPasswordReset(req, res) {
  const { email: submittedEmail } = resetRequestSchema.parse(req.body);
  if (!isMailConfigured()) {
    return res.status(503).json({ error: 'Password recovery email is not configured on the server.' });
  }

  const email = submittedEmail.trim().toLowerCase();
  const result = await pool.query('SELECT id, email FROM users WHERE email = $1', [email]);
  const row = result.rows[0];
  if (row) {
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [row.id]);
      await client.query(
        `UPDATE password_reset_tokens SET used_at = NOW()
         WHERE user_id = $1 AND used_at IS NULL`,
        [row.id],
      );
      await client.query(
        `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at)
         VALUES ($1, $2, $3, NOW() + INTERVAL '30 minutes')`,
        [randomUUID(), row.id, tokenHash],
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }

    const publicUrl = process.env.APP_PUBLIC_URL.replace(/\/$/, '');
    const resetUrl = new URL('/reset-password', `${publicUrl}/`);
    resetUrl.searchParams.set('token', token);
    const appResetUrl = new URL('helptoyou://reset-password');
    appResetUrl.searchParams.set('token', token);
    try {
      await sendPasswordResetEmail({ to: row.email, resetUrl: resetUrl.toString(), appResetUrl: appResetUrl.toString() });
    } catch (error) {
      await pool.query(
        'UPDATE password_reset_tokens SET used_at = NOW() WHERE token_hash = $1 AND used_at IS NULL',
        [tokenHash],
      );
      console.error('Password reset email delivery failed:', error instanceof Error ? error.message : 'Unknown mail error');
    }
  }

  return res.json({
    success: true,
    message: 'If an account exists for that email, password recovery instructions have been sent.',
  });
}

export async function resetPassword(req, res) {
  const input = resetPasswordSchema.parse(req.body);
  const tokenHash = createHash('sha256').update(input.token).digest('hex');
  const passwordHash = await bcrypt.hash(input.password, 12);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const tokenResult = await client.query(
      `SELECT id, user_id FROM password_reset_tokens
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
       FOR UPDATE`,
      [tokenHash],
    );
    const tokenRow = tokenResult.rows[0];
    if (!tokenRow) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This reset link is invalid or expired. Request a new one.' });
    }

    await client.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [passwordHash, tokenRow.user_id]);
    await client.query(
      'UPDATE auth_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
      [tokenRow.user_id],
    );
    await client.query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
      [tokenRow.user_id],
    );
    await client.query('COMMIT');
    return res.json({ success: true, message: 'Your password has been reset. You can now sign in.' });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function logout(req, res) {
  await pool.query(
    'UPDATE auth_sessions SET revoked_at = NOW() WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL',
    [req.sessionId, req.userId],
  );
  return res.json({ success: true });
}

export async function currentUser(req, res) {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.userId]);
  if (!result.rowCount) return res.status(401).json({ error: 'Account no longer exists.' });
  return res.json({ user: publicUser(result.rows[0]) });
}

export async function updateCurrentUser(req, res) {
  const input = z.object({
    firstName: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().min(1).max(100).optional(),
    userType: userRoleSchema.optional(),
    userTypes: z.array(userRoleSchema).min(1).max(6).refine((items) => new Set(items).size === items.length).optional(),
    university: z.string().trim().max(255).nullable().optional(),
    department: z.string().trim().max(255).nullable().optional(),
    designation: z.string().trim().max(150).nullable().optional(),
    educationLevel: z.string().trim().max(100).nullable().optional(),
    skills: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
    bio: z.string().trim().max(2000).nullable().optional(),
    avatarUrl: z.union([
      z.url().max(500),
      z.string().regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/).max(2_500_000),
      z.null(),
    ]).optional(),
    address1: z.string().trim().max(255).nullable().optional(),
    address2: z.string().trim().max(255).nullable().optional(),
    city: z.string().trim().max(100).nullable().optional(),
    state: z.string().trim().max(100).nullable().optional(),
    country: z.string().trim().max(100).nullable().optional(),
    postCode: z.string().trim().max(20).nullable().optional(),
    phone: z.string().trim().max(30).nullable().optional(),
    mobile: z.string().trim().max(30).nullable().optional(),
    allowConnectionRequests: z.boolean().optional(),
    profileSetupStep: z.number().int().min(1).max(3).optional(),
    profileSetupComplete: z.boolean().optional(),
  }).strict()
    .refine((value) => !value.userType || !value.userTypes || value.userTypes.includes(value.userType), {
      message: 'The primary role must be included in the selected roles.', path: ['userTypes'],
    })
    .refine((value) => Object.keys(value).length > 0, 'At least one field is required.')
    .parse(req.body);
  const normalizedInput = { ...input };
  if (input.userTypes && !input.userType) normalizedInput.userType = input.userTypes[0];
  if (input.userType && !input.userTypes) normalizedInput.userTypes = [input.userType];
  const entries = Object.entries(normalizedInput);
  const values = entries.map(([, value]) => value);
  const assignments = entries.map(([key], index) => `${profileFields[key]} = $${index + 1}`);
  values.push(req.userId);
  const result = await pool.query(
    `UPDATE users SET ${assignments.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
    values,
  );
  if (!result.rowCount) return res.status(404).json({ error: 'User profile not found.' });
  return res.json({ user: publicUser(result.rows[0]) });
}
