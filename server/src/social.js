import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { pool } from './db.js';
import { LEARNER_ROLES, MENTOR_ROLES, requireAnyRole } from './permissions.js';

const userColumns = `u.id,''::text AS email,u.first_name AS "firstName",u.last_name AS "lastName",u.user_type AS "userType",
  u.user_roles AS "userTypes",u.is_regional_lead AS "isRegionalLead",u.is_verified AS "isVerified",u.university,u.department,u.designation,
  u.education_level AS "educationLevel",u.skills,u.bio,u.avatar_url AS "avatarUrl",u.created_at AS "createdAt"`;

export async function listMentors(req, res) {
  const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);
  const values = [req.userId];
  const where = [`u.id <> $1`, `u.user_roles && ARRAY['Professor','Alumni']::VARCHAR(32)[]`, `u.allow_connection_requests = TRUE`, `NOT EXISTS (SELECT 1 FROM blocked_users b WHERE (b.user_id = $1 AND b.blocked_user_id = u.id) OR (b.user_id = u.id AND b.blocked_user_id = $1))`];
  if (req.query.role && req.query.role !== 'All') { values.push(String(req.query.role)); where.push(`u.user_roles @> ARRAY[$${values.length}]::VARCHAR(32)[]`); }
  if (req.query.university && req.query.university !== 'All Universities') { values.push(`%${String(req.query.university).slice(0, 160)}%`); where.push(`u.university ILIKE $${values.length}`); }
  if (req.query.search) { values.push(`%${String(req.query.search).slice(0, 100)}%`); where.push(`(u.first_name ILIKE $${values.length} OR u.last_name ILIKE $${values.length} OR u.university ILIKE $${values.length} OR u.department ILIKE $${values.length} OR array_to_string(u.skills, ' ') ILIKE $${values.length})`); }
  values.push(limit);
  const result = await pool.query(
    `WITH viewer_connections AS (
       SELECT CASE WHEN from_user_id = $1 THEN to_user_id ELSE from_user_id END AS mutual_id
       FROM connections WHERE status = 'accepted' AND (from_user_id = $1 OR to_user_id = $1)
     )
     SELECT ${userColumns},
       (SELECT COUNT(DISTINCT vc.mutual_id)::int
        FROM viewer_connections vc
        JOIN connections candidate_connection ON candidate_connection.status = 'accepted'
          AND ((candidate_connection.from_user_id = u.id AND candidate_connection.to_user_id = vc.mutual_id)
            OR (candidate_connection.to_user_id = u.id AND candidate_connection.from_user_id = vc.mutual_id))
        WHERE vc.mutual_id <> u.id
          AND NOT EXISTS (SELECT 1 FROM blocked_users b WHERE (b.user_id = $1 AND b.blocked_user_id = vc.mutual_id) OR (b.user_id = vc.mutual_id AND b.blocked_user_id = $1))
          AND NOT EXISTS (SELECT 1 FROM blocked_users b WHERE (b.user_id = u.id AND b.blocked_user_id = vc.mutual_id) OR (b.user_id = vc.mutual_id AND b.blocked_user_id = u.id))
       ) AS "mutualConnections",
       (SELECT COUNT(*)::int FROM unnest(u.skills) AS skill
        WHERE LOWER(skill) = ANY(SELECT LOWER(viewer_skill) FROM unnest(me.skills) AS viewer_skill)
       ) AS "sharedSkills"
     FROM users u JOIN users me ON me.id = $1
     WHERE ${where.join(' AND ')}
     ORDER BY
       (CASE WHEN me.university IS NOT NULL AND LOWER(u.university) = LOWER(me.university) THEN 35 ELSE 0 END
        + CASE WHEN me.department IS NOT NULL AND LOWER(u.department) = LOWER(me.department) THEN 20 ELSE 0 END
        + 10 * (SELECT COUNT(*)::int FROM unnest(u.skills) AS skill
               WHERE LOWER(skill) = ANY(SELECT LOWER(viewer_skill) FROM unnest(me.skills) AS viewer_skill))
        + 12 * (SELECT COUNT(DISTINCT vc.mutual_id)::int
                FROM viewer_connections vc
                JOIN connections candidate_connection ON candidate_connection.status = 'accepted'
                  AND ((candidate_connection.from_user_id = u.id AND candidate_connection.to_user_id = vc.mutual_id)
                    OR (candidate_connection.to_user_id = u.id AND candidate_connection.from_user_id = vc.mutual_id))
                WHERE vc.mutual_id <> u.id)
       ) DESC, u.created_at DESC
     LIMIT $${values.length}`,
    values,
  );
  return res.json({ items: result.rows });
}

export async function getConnections(req, res) {
  const result = await pool.query(
    `SELECT id, from_user_id AS "fromUserId", to_user_id AS "toUserId", status, message, created_at AS "createdAt"
     FROM connections WHERE from_user_id = $1 OR to_user_id = $1 ORDER BY updated_at DESC LIMIT 200`,
    [req.userId],
  );
  return res.json({ items: result.rows });
}

export async function createConnection(req, res) {
  if (!await requireAnyRole(req, res, LEARNER_ROLES, 'request a mentor connection')) return;
  const input = z.object({ otherUserId: z.uuid(), message: z.string().trim().max(2000).optional() }).parse(req.body);
  if (input.otherUserId === req.userId) return res.status(400).json({ error: 'You cannot connect with your own account.' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [[req.userId, input.otherUserId].sort().join(':')]);
    const target = await client.query('SELECT user_roles,user_type,allow_connection_requests FROM users WHERE id=$1', [input.otherUserId]);
    if (!target.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Account not found.' }); }
    const targetRoles = target.rows[0].user_roles?.length ? target.rows[0].user_roles : [target.rows[0].user_type];
    if (!targetRoles.some((role) => MENTOR_ROLES.includes(role))) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Connection requests can be sent to faculty and mentor profiles.' });
    }
    if (!target.rows[0].allow_connection_requests) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'This member is not accepting connection requests.' });
    }
    const blocked = await client.query(
      `SELECT 1 FROM blocked_users WHERE (user_id = $1 AND blocked_user_id = $2) OR (user_id = $2 AND blocked_user_id = $1)`,
      [req.userId, input.otherUserId],
    );
    if (blocked.rowCount) { await client.query('ROLLBACK'); return res.status(403).json({ error: 'A connection cannot be created between these accounts.' }); }
    const existing = await client.query(
      `SELECT id, from_user_id AS "fromUserId", to_user_id AS "toUserId", status, message, created_at AS "createdAt"
       FROM connections WHERE (from_user_id = $1 AND to_user_id = $2) OR (from_user_id = $2 AND to_user_id = $1)`,
      [req.userId, input.otherUserId],
    );
    if (existing.rowCount) { await client.query('COMMIT'); return res.json({ item: existing.rows[0] }); }
    const result = await client.query(
      `INSERT INTO connections (id, from_user_id, to_user_id, message)
       SELECT $1,$2,u.id,$3 FROM users u WHERE u.id = $4
       ON CONFLICT (user_low,user_high) DO NOTHING
       RETURNING id, from_user_id AS "fromUserId", to_user_id AS "toUserId", status, message, created_at AS "createdAt"`,
      [randomUUID(), req.userId, input.message || 'I would like to connect for education guidance.', input.otherUserId],
    );
    if (!result.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Account not found.' }); }
    await client.query(
      `INSERT INTO notifications (id,user_id,type,title,message,data)
       VALUES ($1,$2,'CONNECTION','New connection request','Someone sent you a connection request',$3)`,
      [randomUUID(), input.otherUserId, JSON.stringify({ connectionId: result.rows[0].id })],
    );
    await client.query('COMMIT');
    return res.status(201).json({ item: result.rows[0] });
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}

export async function updateConnection(req, res) {
  const input = z.object({ status: z.enum(['accepted', 'declined', 'cancelled']) }).parse(req.body);
  if (input.status !== 'cancelled' && !await requireAnyRole(req, res, MENTOR_ROLES, 'respond to a mentor connection request')) return;
  const permission = input.status === 'cancelled' ? 'from_user_id' : 'to_user_id';
  const result = await pool.query(
    `UPDATE connections SET status = $1, updated_at = NOW()
     WHERE id = $2 AND ${permission} = $3 AND status = 'pending'
     RETURNING id, from_user_id AS "fromUserId", to_user_id AS "toUserId", status, message, created_at AS "createdAt"`,
    [input.status, req.params.connectionId, req.userId],
  );
  if (!result.rowCount) return res.status(404).json({ error: 'Connection request not found or unavailable.' });
  if (input.status === 'accepted' || input.status === 'declined') {
    await pool.query(
      `INSERT INTO notifications (id,user_id,type,title,message,data)
       VALUES ($1,$2,'CONNECTION',$3,$4,$5)`,
      [randomUUID(), result.rows[0].fromUserId,
        input.status === 'accepted' ? 'Connection request accepted' : 'Connection request declined',
        input.status === 'accepted' ? 'Your connection request was accepted.' : 'Your connection request was declined.',
        JSON.stringify({ connectionId: result.rows[0].id, status: input.status })],
    );
  }
  return res.json({ item: result.rows[0] });
}

export async function listBlocks(req, res) {
  const result = await pool.query(
    `SELECT b.blocked_user_id AS "targetUserId",u.first_name || ' ' || u.last_name AS "targetName",b.created_at AS "createdAt"
     FROM blocked_users b JOIN users u ON u.id = b.blocked_user_id WHERE b.user_id = $1 ORDER BY b.created_at DESC`,
    [req.userId],
  );
  return res.json({ items: result.rows });
}

export async function blockUser(req, res) {
  const input = z.object({ targetUserId: z.uuid() }).parse(req.body);
  if (input.targetUserId === req.userId) return res.status(400).json({ error: 'You cannot block your own account.' });
  const result = await pool.query(
    `INSERT INTO blocked_users (user_id, blocked_user_id)
     SELECT $1, id FROM users WHERE id = $2 ON CONFLICT DO NOTHING
     RETURNING blocked_user_id AS "targetUserId"`,
    [req.userId, input.targetUserId],
  );
  if (!result.rowCount) {
    const target = await pool.query('SELECT id FROM users WHERE id = $1', [input.targetUserId]);
    if (!target.rowCount) return res.status(404).json({ error: 'Account not found.' });
  }
  return res.status(204).end();
}

export async function unblockUser(req, res) {
  await pool.query('DELETE FROM blocked_users WHERE user_id = $1 AND blocked_user_id = $2', [req.userId, req.params.targetUserId]);
  return res.status(204).end();
}

export async function createReport(req, res) {
  const input = z.object({
    targetUserId: z.uuid(), reason: z.string().trim().min(1).max(2000),
    contentType: z.enum(['profile', 'help_request', 'response', 'message']).optional(),
    contentId: z.uuid().optional(),
  }).parse(req.body);
  if (input.targetUserId === req.userId) return res.status(400).json({ error: 'You cannot report your own account.' });
  const result = await pool.query(
    `INSERT INTO reports (id,reporter_id,target_user_id,reason,content_type,content_id)
     SELECT $1,$2,u.id,$4,$5,$6 FROM users u WHERE u.id = $3 RETURNING id`,
    [randomUUID(), req.userId, input.targetUserId, input.reason, input.contentType || null, input.contentId || null],
  );
  if (!result.rowCount) return res.status(404).json({ error: 'Account not found.' });
  return res.status(201).json({ success: true });
}

export async function listNotifications(req, res) {
  const result = await pool.query(
    `SELECT id,user_id AS "userId",type,title,message AS body,data,is_read AS "isRead",created_at AS "createdAt"
     FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
    [req.userId],
  );
  return res.json({ items: result.rows.map((row) => ({
    ...row,
    relatedId: row.data?.threadId || row.data?.helpRequestId || row.data?.connectionId,
  })) });
}

export async function markNotificationRead(req, res) {
  const result = await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.notificationId, req.userId]);
  if (!result.rowCount) return res.status(404).json({ error: 'Notification not found.' });
  return res.json({ success: true });
}

export async function savePushToken(req, res) {
  const input = z.object({ token: z.string().min(1).max(512), platform: z.enum(['ios', 'android', 'web']) }).parse(req.body);
  await pool.query(
    `INSERT INTO push_tokens (token,user_id,platform) VALUES ($1,$2,$3)
     ON CONFLICT (token) DO UPDATE SET user_id = EXCLUDED.user_id, platform = EXCLUDED.platform, updated_at = NOW()`,
    [input.token, req.userId, input.platform],
  );
  return res.status(204).end();
}

export async function removePushToken(req, res) {
  const input = z.object({ token: z.string().min(1).max(512) }).parse(req.body);
  await pool.query('DELETE FROM push_tokens WHERE token = $1 AND user_id = $2', [input.token, req.userId]);
  return res.status(204).end();
}

export async function submitContactMessage(req, res) {
  const input = z.object({
    name: z.string().trim().min(1).max(200), email: z.email().max(255),
    subject: z.string().trim().min(1).max(200), message: z.string().trim().min(1).max(5000),
  }).parse(req.body);
  const result = await pool.query(
    `INSERT INTO contact_messages (id,name,email,subject,message) VALUES ($1,$2,$3,$4,$5)
     RETURNING id,name,email,subject,message,status,created_at AS "submittedAt"`,
    [randomUUID(), input.name, input.email.toLowerCase(), input.subject, input.message],
  );
  return res.status(201).json({ item: result.rows[0] });
}

async function threadAccess(threadId, userId, client = pool) {
  const result = await client.query(
    `SELECT t.participant_one,t.participant_two,
       EXISTS (SELECT 1 FROM blocked_users b WHERE (b.user_id = t.participant_one AND b.blocked_user_id = t.participant_two)
         OR (b.user_id = t.participant_two AND b.blocked_user_id = t.participant_one)) AS blocked
     FROM chat_threads t WHERE t.id = $1 AND (t.participant_one = $2 OR t.participant_two = $2)`,
    [threadId, userId],
  );
  if (!result.rowCount) return null;
  if (result.rows[0].blocked) return false;
  return result.rows[0];
}

export async function createOrGetThread(req, res) {
  const input = z.object({ otherUserId: z.uuid() }).parse(req.body);
  if (input.otherUserId === req.userId) return res.status(400).json({ error: 'A conversation needs two different accounts.' });
  const participants = await pool.query(
    `SELECT id FROM users WHERE id IN ($1,$2)`, [req.userId, input.otherUserId],
  );
  if (participants.rowCount !== 2) return res.status(404).json({ error: 'Account not found.' });
  const blocked = await pool.query(
    `SELECT 1 FROM blocked_users WHERE (user_id = $1 AND blocked_user_id = $2) OR (user_id = $2 AND blocked_user_id = $1)`,
    [req.userId, input.otherUserId],
  );
  if (blocked.rowCount) return res.status(403).json({ error: 'Messaging is unavailable between these accounts.' });
  const result = await pool.query(
    `INSERT INTO chat_threads (id, participant_one, participant_two)
     VALUES ($1, LEAST($2::uuid,$3::uuid), GREATEST($2::uuid,$3::uuid))
     ON CONFLICT (participant_one,participant_two) DO UPDATE SET updated_at = chat_threads.updated_at
     RETURNING id,participant_one AS "participantOne",participant_two AS "participantTwo",updated_at AS "updatedAt"`,
    [randomUUID(), req.userId, input.otherUserId],
  );
  return res.json({ item: result.rows[0] });
}

export async function listThreads(req, res) {
  const result = await pool.query(
    `SELECT t.id,ARRAY[t.participant_one::text,t.participant_two::text] AS participants,t.updated_at AS "updatedAt",
       other.id AS "otherParticipantId",other.first_name || ' ' || other.last_name AS "otherParticipantName",
       (SELECT COUNT(*)::int FROM chat_messages unread WHERE unread.thread_id = t.id
         AND unread.sender_id <> $1 AND unread.is_read = FALSE) AS "unreadCount",
       m.id AS "messageId",m.sender_id AS "senderId",m.text AS "messageText",m.created_at AS "messageCreatedAt",m.is_read AS "messageIsRead"
     FROM chat_threads t
     JOIN users other ON other.id = CASE WHEN t.participant_one = $1 THEN t.participant_two ELSE t.participant_one END
     LEFT JOIN LATERAL (SELECT id,sender_id,text,created_at,is_read FROM chat_messages WHERE thread_id = t.id ORDER BY created_at DESC,id DESC LIMIT 1) m ON TRUE
     WHERE (t.participant_one = $1 OR t.participant_two = $1)
       AND NOT EXISTS (SELECT 1 FROM blocked_users b WHERE (b.user_id = t.participant_one AND b.blocked_user_id = t.participant_two)
         OR (b.user_id = t.participant_two AND b.blocked_user_id = t.participant_one))
     ORDER BY t.updated_at DESC LIMIT 100`,
    [req.userId],
  );
  const items = result.rows.map((row) => ({
    id: row.id,
    participants: row.participants,
    otherParticipantId: row.otherParticipantId,
    otherParticipantName: row.otherParticipantName,
    updatedAt: row.updatedAt,
    unreadCount: row.unreadCount,
    ...(row.messageId ? { lastMessage: { id: row.messageId, threadId: row.id, senderId: row.senderId, text: row.messageText, createdAt: row.messageCreatedAt, isRead: row.messageIsRead } } : {}),
  }));
  return res.json({ items });
}

export async function getActivitySummary(req, res) {
  const result = await pool.query(
    `SELECT
       (SELECT COUNT(*)::int FROM chat_messages m JOIN chat_threads t ON t.id = m.thread_id
        WHERE m.sender_id <> $1 AND m.is_read = FALSE
          AND (t.participant_one = $1 OR t.participant_two = $1)
          AND NOT EXISTS (SELECT 1 FROM blocked_users b WHERE (b.user_id = t.participant_one AND b.blocked_user_id = t.participant_two)
            OR (b.user_id = t.participant_two AND b.blocked_user_id = t.participant_one))) AS "unreadMessages",
       (SELECT COUNT(*)::int FROM chat_messages WHERE sender_id = $1) AS "messagesSent",
       (SELECT COUNT(*)::int FROM help_responses WHERE author_id = $1) AS "repliesGiven",
       (SELECT COUNT(*)::int FROM help_responses r JOIN help_requests h ON h.id = r.request_id
        WHERE h.author_id = $1 AND r.author_id <> $1) AS "repliesReceived",
       (SELECT COUNT(*)::int FROM help_requests WHERE author_id = $1) AS "questionsAsked",
       (SELECT COUNT(*)::int FROM notifications WHERE user_id = $1 AND is_read = FALSE) AS "unreadNotifications"`,
    [req.userId],
  );
  return res.json(result.rows[0]);
}

export async function listMessages(req, res) {
  const access = await threadAccess(req.params.threadId, req.userId);
  if (!access) return res.status(404).json({ error: 'Conversation not found.' });
  if (access === false) return res.status(403).json({ error: 'Messaging is unavailable between these accounts.' });
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 200);
  const result = await pool.query(
    `SELECT id,thread_id AS "threadId",sender_id AS "senderId",text,is_read AS "isRead",created_at AS "createdAt"
     FROM (SELECT * FROM chat_messages WHERE thread_id = $1 ORDER BY created_at DESC,id DESC LIMIT $2) recent
     ORDER BY created_at ASC,id ASC`,
    [req.params.threadId, limit],
  );
  return res.json({ items: result.rows });
}

export async function sendMessage(req, res) {
  const input = z.object({ text: z.string().trim().min(1).max(5000) }).parse(req.body);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const access = await threadAccess(req.params.threadId, req.userId, client);
    if (!access) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Conversation not found.' }); }
    if (access === false) { await client.query('ROLLBACK'); return res.status(403).json({ error: 'Messaging is unavailable between these accounts.' }); }
    const otherUserId = access.participant_one === req.userId ? access.participant_two : access.participant_one;
    const result = await client.query(
      `INSERT INTO chat_messages (id,thread_id,sender_id,text) VALUES ($1,$2,$3,$4)
       RETURNING id,thread_id AS "threadId",sender_id AS "senderId",text,is_read AS "isRead",created_at AS "createdAt"`,
      [randomUUID(), req.params.threadId, req.userId, input.text],
    );
    await client.query('UPDATE chat_threads SET updated_at = NOW() WHERE id = $1', [req.params.threadId]);
    await client.query(
      `INSERT INTO notifications (id,user_id,type,title,message,data) VALUES ($1,$2,'MESSAGE','New message','You received a new message',$3)`,
      [randomUUID(), otherUserId, JSON.stringify({ threadId: req.params.threadId })],
    );
    await client.query('COMMIT');
    return res.status(201).json({ item: result.rows[0] });
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}

export async function markMessageRead(req, res) {
  const access = await threadAccess(req.params.threadId, req.userId);
  if (!access) return res.status(404).json({ error: 'Conversation not found.' });
  if (access === false) return res.status(403).json({ error: 'Messaging is unavailable between these accounts.' });
  const result = await pool.query(
    `UPDATE chat_messages SET is_read = TRUE WHERE id = $1 AND thread_id = $2 AND sender_id <> $3 RETURNING id`,
    [req.params.messageId, req.params.threadId, req.userId],
  );
  if (!result.rowCount) return res.status(404).json({ error: 'Unread message not found.' });
  return res.json({ success: true });
}
