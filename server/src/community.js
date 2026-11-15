import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { pool } from './db.js';
import { LEARNER_ROLES, MENTOR_ROLES, requireAnyRole } from './permissions.js';

const categories = ['Admissions', 'Research', 'Syllabus & Exam', 'Scholarships', 'Career Guidance', 'General Help'];
const requestFields = `
  h.id, h.title, h.description, h.category, h.university, h.department,
  h.author_id AS "authorId", h.author_name AS "authorName", h.author_role AS "authorRole",
  h.author_university AS "authorUniversity", h.author_designation AS "authorDesignation",
  h.urgency, h.status, h.tags, h.response_count AS "responseCount", h.upvotes,
  h.created_at AS "createdAt", (v.user_id IS NOT NULL) AS "upvotedByMe"`;

export async function listRequests(req, res) {
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
  const cursor = req.query.cursor ? new Date(String(req.query.cursor)) : null;
  if (cursor && Number.isNaN(cursor.getTime())) return res.status(400).json({ error: 'Invalid cursor.' });
  const values = [req.userId];
  const conditions = [`NOT EXISTS (
    SELECT 1 FROM blocked_users b
    WHERE (b.user_id = $1 AND b.blocked_user_id = h.author_id)
       OR (b.user_id = h.author_id AND b.blocked_user_id = $1)
  )`];
  if (req.query.authorId) { values.push(String(req.query.authorId)); conditions.push(`h.author_id = $${values.length}`); }
  if (req.query.status && req.query.status !== 'All') { values.push(String(req.query.status)); conditions.push(`h.status = $${values.length}`); }
  if (req.query.category && req.query.category !== 'All') { values.push(String(req.query.category)); conditions.push(`h.category = $${values.length}`); }
  if (req.query.university && req.query.university !== 'All') { values.push(`%${String(req.query.university).slice(0, 160)}%`); conditions.push(`h.university ILIKE $${values.length}`); }
  if (req.query.search) {
    values.push(`%${String(req.query.search).slice(0, 100)}%`);
    conditions.push(`(h.title ILIKE $${values.length} OR h.description ILIKE $${values.length}
      OR h.university ILIKE $${values.length} OR h.author_name ILIKE $${values.length}
      OR array_to_string(h.tags, ' ') ILIKE $${values.length})`);
  }
  if (cursor) { values.push(cursor.toISOString()); conditions.push(`h.created_at < $${values.length}`); }
  values.push(limit + 1);
  const result = await pool.query(
    `SELECT ${requestFields}, h.accepted_response_id AS "acceptedResponseId" FROM help_requests h
     LEFT JOIN help_request_votes v ON v.request_id = h.id AND v.user_id = $1
     ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
     ORDER BY h.created_at DESC, h.id DESC LIMIT $${values.length}`,
    values,
  );
  const hasMore = result.rows.length > limit;
  const rows = result.rows.slice(0, limit);
  return res.json({ items: rows, nextCursor: hasMore ? rows.at(-1).createdAt : null });
}

export async function getCommunityImpact(req, res) {
  const result = await pool.query(
    `SELECT COUNT(r.id)::int AS "responsesGiven",
       COUNT(DISTINCT h.id) FILTER (WHERE h.status = 'resolved')::int AS "resolvedInquiriesHelped"
     FROM help_responses r
     JOIN help_requests h ON h.id = r.request_id
     WHERE r.author_id = $1 AND h.author_id <> $1
       AND NOT EXISTS (
         SELECT 1 FROM blocked_users b
         WHERE (b.user_id = $1 AND b.blocked_user_id = h.author_id)
            OR (b.user_id = h.author_id AND b.blocked_user_id = $1)
       )`,
    [req.userId],
  );
  return res.json(result.rows[0]);
}

export async function getRequest(req, res) {
  const result = await pool.query(
    `SELECT ${requestFields}, h.accepted_response_id AS "acceptedResponseId" FROM help_requests h
     LEFT JOIN help_request_votes v ON v.request_id = h.id AND v.user_id = $1
     WHERE h.id = $2
       AND NOT EXISTS (SELECT 1 FROM blocked_users b
         WHERE (b.user_id = $1 AND b.blocked_user_id = h.author_id)
            OR (b.user_id = h.author_id AND b.blocked_user_id = $1))`,
    [req.userId, req.params.requestId],
  );
  if (!result.rowCount) return res.status(404).json({ error: 'Question not found.' });
  const responses = await pool.query(
    `SELECT id, request_id AS "requestId", author_id AS "authorId", author_name AS "authorName",
      author_role AS "authorRole", author_university AS "authorUniversity",
      author_designation AS "authorDesignation", content, created_at AS "createdAt",
      (id = $2) AS "isAccepted"
     FROM help_responses WHERE request_id = $1 ORDER BY created_at ASC, id ASC LIMIT 200`,
    [req.params.requestId, result.rows[0].acceptedResponseId],
  );
  return res.json({ item: { ...result.rows[0], responses: responses.rows } });
}

export async function createRequest(req, res) {
  if (!await requireAnyRole(req, res, LEARNER_ROLES, 'ask the community')) return;
  const input = z.object({
    title: z.string().trim().min(1).max(160), description: z.string().trim().min(1).max(5000),
    category: z.enum(categories), university: z.string().trim().min(1).max(160),
    department: z.string().trim().max(255).optional(), urgency: z.enum(['Low', 'Medium', 'High']).default('Medium'),
    tags: z.array(z.string().trim().min(1).max(60)).max(10).optional(),
  }).parse(req.body);
  const result = await pool.query(
    `INSERT INTO help_requests (id, title, description, category, university, department,
      author_id, author_name, author_role, author_university, author_designation, urgency, tags)
     SELECT $1,$2,$3,$4,$5,$6,u.id,u.first_name || ' ' || u.last_name,u.user_type,u.university,u.designation,$7,$8
     FROM users u WHERE u.id = $9 RETURNING *`,
    [randomUUID(), input.title, input.description, input.category, input.university,
      input.department || null, input.urgency, input.tags || [], req.userId],
  );
  if (!result.rowCount) return res.status(401).json({ error: 'Account no longer exists.' });
  return res.status(201).json({ item: { ...result.rows[0], authorId: result.rows[0].author_id, authorName: result.rows[0].author_name, authorRole: result.rows[0].author_role, authorUniversity: result.rows[0].author_university, authorDesignation: result.rows[0].author_designation, responseCount: result.rows[0].response_count, createdAt: result.rows[0].created_at.toISOString() } });
}

export async function createResponse(req, res) {
  if (!await requireAnyRole(req, res, MENTOR_ROLES, 'post community guidance')) return;
  const input = z.object({ content: z.string().trim().min(1).max(5000) }).parse(req.body);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const request = await client.query('SELECT id,author_id FROM help_requests WHERE id = $1 FOR UPDATE', [req.params.requestId]);
    if (!request.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Question not found.' }); }
    const blocked = await client.query(
      `SELECT 1 FROM blocked_users WHERE (user_id = $1 AND blocked_user_id = $2) OR (user_id = $2 AND blocked_user_id = $1)`,
      [req.userId, request.rows[0].author_id],
    );
    if (blocked.rowCount) { await client.query('ROLLBACK'); return res.status(403).json({ error: 'Replies are unavailable between these accounts.' }); }
    const result = await client.query(
      `INSERT INTO help_responses (id, request_id, author_id, author_name, author_role, author_university, author_designation, content)
       SELECT $1,$2,u.id,u.first_name || ' ' || u.last_name,u.user_type,u.university,u.designation,$3
       FROM users u WHERE u.id = $4 RETURNING id, request_id AS "requestId", author_id AS "authorId",
       author_name AS "authorName", author_role AS "authorRole", author_university AS "authorUniversity",
       author_designation AS "authorDesignation", content, created_at AS "createdAt"`,
      [randomUUID(), req.params.requestId, input.content, req.userId],
    );
    if (!result.rowCount) { await client.query('ROLLBACK'); return res.status(401).json({ error: 'Account no longer exists.' }); }
    await client.query(`UPDATE help_requests SET response_count = response_count + 1,
      status = CASE WHEN status = 'open' THEN 'in_progress' ELSE status END WHERE id = $1`, [req.params.requestId]);
    await client.query('COMMIT');
    return res.status(201).json({ item: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}

export async function toggleVote(req, res) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const request = await client.query('SELECT id,author_id FROM help_requests WHERE id = $1 FOR UPDATE', [req.params.requestId]);
    if (!request.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Question not found.' }); }
    const blocked = await client.query(
      `SELECT 1 FROM blocked_users WHERE (user_id = $1 AND blocked_user_id = $2) OR (user_id = $2 AND blocked_user_id = $1)`,
      [req.userId, request.rows[0].author_id],
    );
    if (blocked.rowCount) { await client.query('ROLLBACK'); return res.status(403).json({ error: 'Voting is unavailable between these accounts.' }); }
    const vote = await client.query('DELETE FROM help_request_votes WHERE request_id = $1 AND user_id = $2 RETURNING user_id', [req.params.requestId, req.userId]);
    const upvoted = !vote.rowCount;
    if (upvoted) await client.query('INSERT INTO help_request_votes (request_id, user_id) VALUES ($1,$2)', [req.params.requestId, req.userId]);
    const result = await client.query('UPDATE help_requests SET upvotes = GREATEST(0, upvotes + $2) WHERE id = $1 RETURNING upvotes', [req.params.requestId, upvoted ? 1 : -1]);
    await client.query('COMMIT');
    return res.json({ upvotes: result.rows[0].upvotes, upvoted });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}

export async function resolveRequest(req, res) {
  const result = await pool.query(
    `UPDATE help_requests SET status = 'resolved', resolved_at = NOW()
     WHERE id = $1 AND author_id = $2 AND status <> 'resolved' RETURNING id`,
    [req.params.requestId, req.userId],
  );
  if (!result.rowCount) return res.status(404).json({ error: 'Question not found or cannot be resolved by this account.' });
  return res.json({ success: true });
}
