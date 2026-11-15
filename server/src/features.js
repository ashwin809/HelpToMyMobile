import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { pool } from './db.js';
import { LEARNER_ROLES, MENTOR_ROLES, requireAnyRole } from './permissions.js';

const id = z.uuid();
const safeUrl = z.url().refine((value) => ['https:', 'http:'].includes(new URL(value).protocol), 'Enter a valid web link.');

export async function listStudyCircles(req, res) {
  const result = await pool.query(
    `SELECT c.id,c.name,c.topic,c.description,c.university,c.is_demo AS "isDemo",c.created_at AS "createdAt",
      COUNT(m.user_id)::int AS "memberCount",
      BOOL_OR(m.user_id = $1) AS "isMember"
     FROM study_circles c LEFT JOIN study_circle_members m ON m.circle_id = c.id
     GROUP BY c.id ORDER BY c.is_demo DESC,c.created_at DESC LIMIT 100`,
    [req.userId],
  );
  return res.json({ items: result.rows });
}

export async function createStudyCircle(req, res) {
  const input = z.object({ name: z.string().trim().min(3).max(120), topic: z.string().trim().min(2).max(100), description: z.string().trim().min(10).max(1000), university: z.string().trim().max(255).optional() }).strict().parse(req.body);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const circleId = randomUUID();
    const result = await client.query(
      `INSERT INTO study_circles (id,name,topic,description,university,creator_id)
       SELECT $1,$2,$3,$4,COALESCE($5,u.university),u.id FROM users u WHERE u.id = $6
       RETURNING id,name,topic,description,university,is_demo AS "isDemo",created_at AS "createdAt"`,
      [circleId,input.name,input.topic,input.description,input.university || null,req.userId],
    );
    if (!result.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Account not found.' }); }
    await client.query('INSERT INTO study_circle_members (circle_id,user_id) VALUES ($1,$2)', [circleId,req.userId]);
    await client.query('COMMIT');
    return res.status(201).json({ item: { ...result.rows[0], memberCount: 1, isMember: true } });
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}

export async function joinStudyCircle(req, res) {
  const circleId = id.parse(req.params.circleId);
  const result = await pool.query(
    `INSERT INTO study_circle_members (circle_id,user_id)
     SELECT c.id,$2 FROM study_circles c WHERE c.id = $1
     ON CONFLICT DO NOTHING RETURNING circle_id`,
    [circleId,req.userId],
  );
  const exists = result.rowCount || (await pool.query('SELECT 1 FROM study_circles WHERE id=$1',[circleId])).rowCount;
  if (!exists) return res.status(404).json({ error: 'Study circle not found.' });
  return res.json({ joined: true });
}

export async function listCirclePosts(req, res) {
  const circleId = id.parse(req.params.circleId);
  const member = await pool.query('SELECT 1 FROM study_circle_members WHERE circle_id=$1 AND user_id=$2',[circleId,req.userId]);
  if (!member.rowCount) return res.status(403).json({ error: 'Join this study circle to view its discussion.' });
  const result = await pool.query(
    `SELECT p.id,p.circle_id AS "circleId",p.author_id AS "authorId",u.first_name AS "firstName",u.last_name AS "lastName",
      u.user_type AS "userType",p.content,p.created_at AS "createdAt"
     FROM study_circle_posts p JOIN users u ON u.id=p.author_id
     WHERE p.circle_id=$1 AND NOT EXISTS (SELECT 1 FROM blocked_users b WHERE (b.user_id=$2 AND b.blocked_user_id=p.author_id) OR (b.user_id=p.author_id AND b.blocked_user_id=$2))
     ORDER BY p.created_at DESC,p.id DESC LIMIT 100`,
    [circleId,req.userId],
  );
  return res.json({ items: result.rows });
}

export async function createCirclePost(req, res) {
  const circleId = id.parse(req.params.circleId);
  const input = z.object({ content: z.string().trim().min(2).max(2000) }).strict().parse(req.body);
  const result = await pool.query(
    `INSERT INTO study_circle_posts (id,circle_id,author_id,content)
     SELECT $1,m.circle_id,u.id,$4 FROM study_circle_members m JOIN users u ON u.id=m.user_id
     WHERE m.circle_id=$2 AND m.user_id=$3
     RETURNING id,circle_id AS "circleId",author_id AS "authorId",content,created_at AS "createdAt"`,
    [randomUUID(),circleId,req.userId,input.content],
  );
  if (!result.rowCount) return res.status(403).json({ error: 'Join this study circle before posting.' });
  const author = await pool.query('SELECT first_name AS "firstName",last_name AS "lastName",user_type AS "userType" FROM users WHERE id=$1',[req.userId]);
  await pool.query(
    `INSERT INTO notifications (id,user_id,type,title,message,data)
     SELECT gen_random_uuid(),user_id,'CIRCLE_UPDATE','New study circle update',$3,jsonb_build_object('circleId',$1::text)
     FROM study_circle_members WHERE circle_id=$2 AND user_id<>$4`,
    [circleId,circleId,`${author.rows[0].firstName} shared an update.`,req.userId],
  );
  return res.status(201).json({ item: { ...result.rows[0], ...author.rows[0] } });
}

export async function listOfficeHours(req, res) {
  const result = await pool.query(
    `SELECT o.id,o.mentor_id AS "mentorId",u.first_name AS "firstName",u.last_name AS "lastName",
      u.user_type AS "userType",u.designation,u.university,u.avatar_url AS "avatarUrl",
      o.title,o.starts_at AS "startsAt",o.ends_at AS "endsAt",o.meeting_url AS "meetingUrl",
      o.is_demo AS "isDemo",b.id AS "bookingId",b.status AS "bookingStatus",b.note AS "bookingNote",
      EXISTS (SELECT 1 FROM office_hour_bookings taken WHERE taken.office_hour_id=o.id AND taken.status IN ('requested','accepted')) AS "isBooked",
      EXISTS (
        SELECT 1 FROM connections c WHERE c.status='accepted'
          AND ((c.from_user_id=o.mentor_id AND c.to_user_id=$1) OR (c.to_user_id=o.mentor_id AND c.from_user_id=$1))
      ) AS "canRequest",
      bu.first_name AS "bookerFirstName",bu.last_name AS "bookerLastName",(o.mentor_id = $1) AS "isMine",
      gce.event_url AS "googleEventUrl"
     FROM mentor_office_hours o JOIN users u ON u.id=o.mentor_id
     LEFT JOIN office_hour_bookings b ON b.office_hour_id=o.id AND b.status IN ('requested','accepted') AND (b.student_id=$1 OR o.mentor_id=$1)
     LEFT JOIN google_calendar_events gce ON gce.booking_id=b.id AND gce.user_id=$1
     LEFT JOIN users bu ON bu.id=b.student_id
     WHERE o.starts_at > NOW() - INTERVAL '1 day'
     ORDER BY o.starts_at ASC LIMIT 100`,
    [req.userId],
  );
  return res.json({ items: result.rows });
}

export async function createOfficeHour(req, res) {
  if (!await requireAnyRole(req, res, MENTOR_ROLES, 'coordinate mentor appointments')) return;
  const input = z.object({ title: z.string().trim().min(3).max(160), startsAt: z.iso.datetime(), endsAt: z.iso.datetime(), meetingUrl: safeUrl.optional() }).strict().parse(req.body);
  if (new Date(input.endsAt) <= new Date(input.startsAt) || new Date(input.startsAt) <= new Date()) return res.status(400).json({ error: 'Choose a future start time and a later end time.' });
  const result = await pool.query(
    `INSERT INTO mentor_office_hours (id,mentor_id,title,starts_at,ends_at,meeting_url)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id,title,starts_at AS "startsAt",ends_at AS "endsAt",meeting_url AS "meetingUrl"`,
    [randomUUID(),req.userId,input.title,input.startsAt,input.endsAt,input.meetingUrl || null],
  );
  return res.status(201).json({ item: { ...result.rows[0], mentorId: req.userId, isMine: true } });
}

export async function bookOfficeHour(req, res) {
  if (!await requireAnyRole(req, res, LEARNER_ROLES, 'request a mentor appointment')) return;
  const input = z.object({ note: z.string().trim().max(1000).optional() }).strict().parse(req.body ?? {});
  const slotId = id.parse(req.params.officeHourId);
  const slot = await pool.query('SELECT mentor_id,starts_at FROM mentor_office_hours WHERE id=$1',[slotId]);
  if (!slot.rowCount || slot.rows[0].starts_at <= new Date()) return res.status(404).json({ error: 'This office hour is no longer available.' });
  if (slot.rows[0].mentor_id === req.userId) return res.status(400).json({ error: 'You cannot book your own office hour.' });
  const connection = await pool.query(
    `SELECT 1 FROM connections WHERE status='accepted'
      AND ((from_user_id=$1 AND to_user_id=$2) OR (from_user_id=$2 AND to_user_id=$1))`,
    [req.userId, slot.rows[0].mentor_id],
  );
  if (!connection.rowCount) return res.status(403).json({ error: 'Connect with this mentor before requesting an office hour.' });
  const result = await pool.query(
    `INSERT INTO office_hour_bookings (id,office_hour_id,student_id,note)
     VALUES ($1,$2,$3,$4) ON CONFLICT (office_hour_id) WHERE status IN ('requested','accepted') DO NOTHING RETURNING id,status`,
    [randomUUID(),slotId,req.userId,input.note || null],
  );
  if (!result.rowCount) return res.status(409).json({ error: 'This office hour has already been booked.' });
  await pool.query(
    `INSERT INTO notifications (id,user_id,type,title,message,data)
     SELECT $1,mentor_id,'OFFICE_HOURS_BOOKING','Office hour requested','A student requested one of your guidance sessions.',jsonb_build_object('officeHourId',id)
     FROM mentor_office_hours WHERE id=$2`,
    [randomUUID(),slotId],
  );
  return res.status(201).json({ item: result.rows[0] });
}

export async function updateOfficeHourBooking(req, res) {
  const bookingId = id.parse(req.params.bookingId);
  const input = z.object({ status: z.enum(['accepted','declined','cancelled']) }).strict().parse(req.body);
  if (input.status !== 'cancelled' && !await requireAnyRole(req, res, MENTOR_ROLES, 'respond to appointment requests')) return;
  if (input.status === 'cancelled' && !await requireAnyRole(req, res, LEARNER_ROLES, 'cancel an appointment request')) return;
  const permission = input.status === 'cancelled' ? 'b.student_id' : 'o.mentor_id';
  const allowedStatuses = input.status === 'cancelled' ? `('requested','accepted')` : `('requested')`;
  const result = await pool.query(
    `UPDATE office_hour_bookings b SET status=$1 FROM mentor_office_hours o
     WHERE b.id=$2 AND b.office_hour_id=o.id AND ${permission}=$3 AND b.status IN ${allowedStatuses} AND o.starts_at > NOW()
     RETURNING b.id,b.student_id AS "studentId",o.mentor_id AS "mentorId",b.office_hour_id AS "officeHourId",b.status`,
    [input.status,bookingId,req.userId],
  );
  if (!result.rowCount) return res.status(404).json({ error: 'Booking request not found or already answered.' });
  const row = result.rows[0];
  if (input.status === 'cancelled') {
    await pool.query(
      `INSERT INTO notifications (id,user_id,type,title,message,data) VALUES ($1,$2,'OFFICE_HOURS_RESPONSE','Office hour cancelled','The student cancelled the session request.',$3)`,
      [randomUUID(),row.mentorId,JSON.stringify({ officeHourId: row.officeHourId, bookingId: row.id })],
    );
    return res.json({ item: row });
  }
  await pool.query(
    `INSERT INTO notifications (id,user_id,type,title,message,data) VALUES ($1,$2,'OFFICE_HOURS_RESPONSE',$3,$4,$5)`,
    [randomUUID(),row.studentId,`Office hour ${input.status}`,`The mentor ${input.status} your session request.`,JSON.stringify({ officeHourId: row.officeHourId, bookingId: row.id })],
  );
  return res.json({ item: row });
}

export async function listOpportunities(req, res) {
  const result = await pool.query(
    `SELECT o.id,o.title,o.organization,o.kind,o.description,o.eligibility,o.deadline,o.apply_url AS "applyUrl",
      o.university,o.is_demo AS "isDemo",o.created_at AS "createdAt",(s.user_id IS NOT NULL) AS "isSaved"
     FROM opportunities o LEFT JOIN saved_opportunities s ON s.opportunity_id=o.id AND s.user_id=$1
     ORDER BY (o.deadline IS NULL),o.deadline ASC,o.created_at DESC LIMIT 100`,
    [req.userId],
  );
  return res.json({ items: result.rows });
}

export async function createOpportunity(req, res) {
  if (!await requireAnyRole(req, res, MENTOR_ROLES, 'publish an opportunity listing')) return;
  const input = z.object({
    title: z.string().trim().min(4).max(180), organization: z.string().trim().min(2).max(160),
    kind: z.enum(['Scholarship','Internship','Research','Competition','Other']),
    description: z.string().trim().min(10).max(2000), eligibility: z.string().trim().max(500).optional(),
    deadline: z.iso.date().nullable().optional(), applyUrl: safeUrl.optional(), university: z.string().trim().max(255).optional(),
  }).strict().parse(req.body);
  const result = await pool.query(
    `INSERT INTO opportunities (id,title,organization,kind,description,eligibility,deadline,apply_url,university,created_by)
     SELECT $1,$2,$3,$4,$5,$6,$7,$8,COALESCE($9,u.university),u.id FROM users u WHERE u.id=$10
     RETURNING id,title,organization,kind,description,eligibility,deadline,apply_url AS "applyUrl",university,is_demo AS "isDemo",created_at AS "createdAt"`,
    [randomUUID(),input.title,input.organization,input.kind,input.description,input.eligibility || null,input.deadline || null,input.applyUrl || null,input.university || null,req.userId],
  );
  if (!result.rowCount) return res.status(404).json({ error: 'Account not found.' });
  return res.status(201).json({ item: { ...result.rows[0], isSaved: false } });
}

export async function toggleSavedOpportunity(req, res) {
  const opportunityId = id.parse(req.params.opportunityId);
  const removed = await pool.query('DELETE FROM saved_opportunities WHERE user_id=$1 AND opportunity_id=$2 RETURNING opportunity_id',[req.userId,opportunityId]);
  if (removed.rowCount) return res.json({ saved: false });
  const inserted = await pool.query(
    'INSERT INTO saved_opportunities (user_id,opportunity_id) SELECT $1,id FROM opportunities WHERE id=$2 ON CONFLICT DO NOTHING RETURNING opportunity_id',
    [req.userId,opportunityId],
  );
  if (!inserted.rowCount) {
    const exists = await pool.query('SELECT 1 FROM opportunities WHERE id=$1',[opportunityId]);
    if (!exists.rowCount) return res.status(404).json({ error: 'Opportunity not found.' });
  }
  return res.json({ saved: true });
}

export async function listGoals(req, res) {
  const result = await pool.query(
    `SELECT id,title,category,due_date AS "dueDate",progress,created_at AS "createdAt",updated_at AS "updatedAt"
     FROM learning_goals WHERE user_id=$1 ORDER BY due_date NULLS LAST,created_at DESC`,[req.userId],
  );
  return res.json({ items: result.rows });
}

export async function createGoal(req, res) {
  const input = z.object({ title: z.string().trim().min(3).max(160), category: z.string().trim().min(2).max(40).default('Study'), dueDate: z.iso.date().nullable().optional() }).strict().parse(req.body);
  const result = await pool.query(
    `INSERT INTO learning_goals (id,user_id,title,category,due_date) VALUES ($1,$2,$3,$4,$5)
     RETURNING id,title,category,due_date AS "dueDate",progress,created_at AS "createdAt",updated_at AS "updatedAt"`,
    [randomUUID(),req.userId,input.title,input.category,input.dueDate || null],
  );
  return res.status(201).json({ item: result.rows[0] });
}

export async function updateGoal(req, res) {
  const goalId = id.parse(req.params.goalId);
  const input = z.object({ title: z.string().trim().min(3).max(160).optional(), category: z.string().trim().min(2).max(40).optional(), dueDate: z.iso.date().nullable().optional(), progress: z.number().int().min(0).max(100).optional() }).strict().refine((value) => Object.keys(value).length > 0).parse(req.body);
  const map = { title: 'title', category: 'category', dueDate: 'due_date', progress: 'progress' };
  const entries = Object.entries(input);
  const values = entries.map(([,value]) => value);
  const set = entries.map(([key],index) => `${map[key]}=$${index+1}`);
  values.push(goalId,req.userId);
  const result = await pool.query(
    `UPDATE learning_goals SET ${set.join(',')},updated_at=NOW() WHERE id=$${values.length-1} AND user_id=$${values.length}
     RETURNING id,title,category,due_date AS "dueDate",progress,created_at AS "createdAt",updated_at AS "updatedAt"`,values,
  );
  if (!result.rowCount) return res.status(404).json({ error: 'Goal not found.' });
  return res.json({ item: result.rows[0] });
}

export async function deleteGoal(req, res) {
  const result = await pool.query('DELETE FROM learning_goals WHERE id=$1 AND user_id=$2 RETURNING id',[id.parse(req.params.goalId),req.userId]);
  if (!result.rowCount) return res.status(404).json({ error: 'Goal not found.' });
  return res.json({ success: true });
}

export async function listResources(req, res) {
  const result = await pool.query(
    `SELECT id,title,description,category,url,university,is_demo AS "isDemo",created_at AS "createdAt"
     FROM resources ORDER BY is_demo DESC,created_at DESC LIMIT 200`,
  );
  return res.json({ items: result.rows });
}

export async function createResource(req, res) {
  const input = z.object({ title: z.string().trim().min(3).max(180), description: z.string().trim().min(5).max(1200), category: z.string().trim().min(2).max(60), url: safeUrl, university: z.string().trim().max(255).optional() }).strict().parse(req.body);
  const result = await pool.query(
    `INSERT INTO resources (id,title,description,category,url,university,created_by)
     SELECT $1,$2,$3,$4,$5,COALESCE($6,u.university),u.id FROM users u WHERE u.id=$7
     RETURNING id,title,description,category,url,university,is_demo AS "isDemo",created_at AS "createdAt"`,
    [randomUUID(),input.title,input.description,input.category,input.url,input.university || null,req.userId],
  );
  if (!result.rowCount) return res.status(404).json({ error: 'Account not found.' });
  return res.status(201).json({ item: result.rows[0] });
}

export async function acceptHelpResponse(req, res) {
  const input = z.object({}).strict().parse(req.body ?? {});
  void input;
  const result = await pool.query(
    `UPDATE help_requests h SET accepted_response_id=r.id,status='resolved',resolved_at=COALESCE(h.resolved_at,NOW())
     FROM help_responses r WHERE h.id=$1 AND h.author_id=$2 AND r.id=$3 AND r.request_id=h.id
     RETURNING h.id`,
    [id.parse(req.params.requestId),req.userId,id.parse(req.params.responseId)],
  );
  if (!result.rowCount) return res.status(404).json({ error: 'Only the question author can choose an answer on their question.' });
  return res.json({ acceptedResponseId: req.params.responseId });
}
