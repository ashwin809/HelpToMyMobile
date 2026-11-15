import 'dotenv/config';
import { randomBytes, randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { pool } from './db.js';

const people = [
  {
    key: 'professor', email: 'demo.professor@example.invalid', firstName: 'Demo', lastName: 'Dr. Ananya Raman',
    userType: 'Professor', university: 'Anna University, Chennai', department: 'Computer Science',
    designation: 'Sample Faculty Mentor', skills: ['Research', 'Machine Learning', 'Project Guidance'],
    bio: 'Fictional sample profile for a local presentation. Offers example guidance on research and computing.',
  },
  {
    key: 'alumni', email: 'demo.alumni@example.invalid', firstName: 'Demo', lastName: 'Karthik Iyer',
    userType: 'Alumni', university: 'NIT Trichy', department: 'Information Technology',
    designation: 'Sample Alumni Career Mentor', skills: ['Career Guidance', 'Interview Preparation', 'Data Structures'],
    bio: 'Fictional sample profile for a local presentation. Shares example career and interview guidance.',
  },
  {
    key: 'volunteer', email: 'demo.volunteer@example.invalid', firstName: 'Demo', lastName: 'Meera Das',
    userType: 'Volunteer', university: 'Anna University, Chennai', department: 'Student Support',
    designation: 'Sample Student Support Volunteer', skills: ['Scholarships', 'Admissions', 'Student Support'],
    bio: 'Fictional sample profile for a local presentation. Helps demonstrate student support discovery.',
  },
  {
    key: 'student', email: 'demo.student@example.invalid', firstName: 'Demo', lastName: 'Nila Joseph',
    userType: 'Student', university: 'Anna University, Chennai', department: 'Computer Science',
    designation: 'Sample Student', skills: ['Scholarships', 'Research'],
    bio: 'Fictional sample student profile for the local presentation.',
  },
  {
    key: 'applicant', email: 'demo.applicant@example.invalid', firstName: 'Demo', lastName: 'Arjun Sen',
    userType: 'Applicant', university: 'NIT Trichy', department: 'Engineering',
    designation: 'Sample Applicant', skills: ['Admissions', 'Career Guidance'],
    bio: 'Fictional sample applicant profile for the local presentation.',
  },
];

async function findOrCreatePerson(person) {
  const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 10);
  await pool.query(
    `INSERT INTO users (
       id, email, password_hash, first_name, last_name, user_type, user_roles, university,
       department, designation, skills, bio
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     ON CONFLICT DO NOTHING`,
    [randomUUID(), person.email, passwordHash, person.firstName, person.lastName,
      person.userType, [person.userType], person.university, person.department, person.designation,
      person.skills, person.bio],
  );
  const result = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [person.email]);
  return result.rows[0].id;
}

async function ensureRequest({ authorId, author, title, description, category, university, status, tags, responder, response }) {
  let result = await pool.query(
    'SELECT id FROM help_requests WHERE author_id = $1 AND title = $2',
    [authorId, `[DEMO] ${title}`],
  );
  let requestId = result.rows[0]?.id;
  if (!requestId) {
    requestId = randomUUID();
    await pool.query(
      `INSERT INTO help_requests (
         id, title, description, category, university, department, author_id,
         author_name, author_role, author_university, author_designation,
         urgency, status, tags
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [requestId, `[DEMO] ${title}`, description, category, university, author.department,
        authorId, `${author.firstName} ${author.lastName}`, author.userType,
        author.university, author.designation, 'Medium', status, tags],
    );
  }

  if (responder && response) {
    await pool.query(
      `INSERT INTO help_responses (
         id, request_id, author_id, author_name, author_role,
         author_university, author_designation, content
       )
       SELECT $1,$2,u.id,u.first_name || ' ' || u.last_name,u.user_type,
         u.university,u.designation,$4::varchar(5000)
       FROM users u
       WHERE u.id = $3 AND NOT EXISTS (
         SELECT 1 FROM help_responses existing
         WHERE existing.request_id = $2 AND existing.author_id = $3 AND existing.content = $4::varchar(5000)
       )`,
      [randomUUID(), requestId, responder, response],
    );
    await pool.query(
      `UPDATE help_requests h SET response_count = (
         SELECT COUNT(*)::int FROM help_responses r WHERE r.request_id = h.id
       ) WHERE h.id = $1`,
      [requestId],
    );
  }
}

async function seedSampleCatalog(peopleByKey) {
  const circles = [
    ['[DEMO] GATE preparation circle','Exam preparation','Weekly focus sessions for planning GATE topics, practice, and revision.','Anna University, Chennai',peopleByKey.student],
    ['[DEMO] Research starters','Research','A peer group for reading papers, refining questions, and learning research methods.','NIT Trichy',peopleByKey.applicant],
    ['[DEMO] Scholarship application support','Scholarships','Share checklists and peer support while preparing scholarship applications.','Anna University, Chennai',peopleByKey.volunteer],
  ];
  for (const [name,topic,description,university,creator] of circles) {
    await pool.query(
      `INSERT INTO study_circles (id,name,topic,description,university,creator_id,is_demo)
       SELECT $1,$2::varchar(120),$3,$4,$5,$6,TRUE WHERE NOT EXISTS (SELECT 1 FROM study_circles WHERE name=$2::varchar(120))`,
      [randomUUID(),name,topic,description,university,creator],
    );
    const circle = await pool.query('SELECT id FROM study_circles WHERE name=$1',[name]);
    for (const memberId of Object.values(peopleByKey)) {
      await pool.query('INSERT INTO study_circle_members (circle_id,user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',[circle.rows[0].id,memberId]);
    }
    await pool.query(
      `INSERT INTO study_circle_posts (id,circle_id,author_id,content)
       SELECT $1,$2,$3,$4::varchar(2000) WHERE NOT EXISTS (
         SELECT 1 FROM study_circle_posts WHERE circle_id=$2 AND author_id=$3 AND content=$4::varchar(2000)
       )`,
      [randomUUID(),circle.rows[0].id,creator,`Fictional sample update for this demo circle: let's share one small goal for the week in ${topic.toLowerCase()}.`],
    );
  }

  const hours = [
    ['Sample research planning session',peopleByKey.professor,2],
    ['Sample career questions drop-in',peopleByKey.alumni,4],
  ];
  for (const [title,mentor,days] of hours) {
    await pool.query(
      `INSERT INTO mentor_office_hours (id,mentor_id,title,starts_at,ends_at,is_demo)
       SELECT $1,$2,$3::varchar(160),NOW()+($4::int * INTERVAL '1 day'),NOW()+($4::int * INTERVAL '1 day')+INTERVAL '30 minutes',TRUE
       WHERE NOT EXISTS (SELECT 1 FROM mentor_office_hours WHERE mentor_id=$2 AND title=$3::varchar(160) AND is_demo=TRUE)`,
      [randomUUID(),mentor,title,String(days)],
    );
  }

  const opportunities = [
    ['[DEMO] Student research micro-grant','HelpToYou Sample Program','Research','A fictional listing showing how small project grants could appear. Check official program information before applying.','Current students with a short research proposal.'],
    ['[DEMO] Campus innovation challenge','HelpToYou Sample Program','Competition','A sample team challenge for building an educational or community-focused prototype.','Student teams of two to five.'],
    ['[DEMO] Alumni internship pathway','HelpToYou Sample Program','Internship','A fictional internship card demonstrating role details, eligibility, and saved opportunities.','Applicants should review the employer listing.'],
    ['[DEMO] Need-based scholarship listing','HelpToYou Sample Program','Scholarship','A sample scholarship listing. Eligibility and deadlines must be confirmed with the provider.','Students who meet the provider\'s criteria.'],
  ];
  for (const [title,organization,kind,description,eligibility] of opportunities) {
    await pool.query(
      `INSERT INTO opportunities (id,title,organization,kind,description,eligibility,is_demo)
       SELECT $1,$2::varchar(180),$3,$4,$5,$6,TRUE WHERE NOT EXISTS (SELECT 1 FROM opportunities WHERE title=$2::varchar(180))`,
      [randomUUID(),title,organization,kind,description,eligibility],
    );
  }

  const resources = [
    ['[DEMO] Research paper reading checklist','A sample checklist for identifying a paper\'s research question, method, evidence, and limitations.','Research methods','https://example.com/research-reading-checklist','Anna University, Chennai'],
    ['[DEMO] Scholarship document planner','A sample document checklist for organizing an application before its deadline.','Scholarships','https://example.com/scholarship-document-planner','Anna University, Chennai'],
    ['[DEMO] Weekly study planner','A printable-style weekly plan example for balancing classes, practice, and revision.','Study skills','https://example.com/weekly-study-planner','NIT Trichy'],
  ];
  for (const [title,description,category,url,university] of resources) {
    await pool.query(
      `INSERT INTO resources (id,title,description,category,url,university,created_by,is_demo)
       SELECT $1,$2::varchar(180),$3,$4,$5,$6,$7,TRUE WHERE NOT EXISTS (SELECT 1 FROM resources WHERE title=$2::varchar(180))`,
      [randomUUID(),title,description,category,url,university,peopleByKey.volunteer],
    );
  }
}

try {
  const ids = {};
  for (const person of people) ids[person.key] = await findOrCreatePerson(person);

  await seedSampleCatalog(ids);

  await ensureRequest({
    authorId: ids.student, author: people.find((person) => person.key === 'student'),
    title: 'How can I plan GATE preparation with my semester classes?',
    description: 'I want to make a realistic weekly plan that leaves time for coursework and revision. What should I prioritize first?',
    category: 'Syllabus & Exam', university: 'Anna University, Chennai', status: 'resolved',
    tags: ['GATE', 'Study plan', 'Demo'], responder: ids.professor,
    response: 'Start by mapping the exam topics against your semester calendar. Use short focused blocks for one topic at a time, then reserve a weekly session for practice questions and reviewing mistakes. This is sample guidance for the demo.',
  });
  await ensureRequest({
    authorId: ids.applicant, author: people.find((person) => person.key === 'applicant'),
    title: 'What should I include when contacting a research supervisor?',
    description: 'I am interested in data science research. How do I write a concise first message to a professor?',
    category: 'Research', university: 'NIT Trichy', status: 'in_progress',
    tags: ['Research', 'Mentorship', 'Demo'], responder: ids.alumni,
    response: 'Introduce yourself, mention one specific project or paper of theirs, state the question you are exploring, and ask whether they are open to a short discussion. Keep it concise and attach a CV only if requested. This is sample guidance for the demo.',
  });
  await ensureRequest({
    authorId: ids.student, author: people.find((person) => person.key === 'student'),
    title: 'Which documents should I prepare before applying for a scholarship?',
    description: 'I am collecting application materials and want to avoid missing a document close to the deadline.',
    category: 'Scholarships', university: 'Anna University, Chennai', status: 'open',
    tags: ['Scholarship', 'Application', 'Demo'],
  });

  console.info('Local demo profiles, posts, circles, office hours, opportunities, and resources are ready. Demo items are labeled as fictional samples.');
} finally {
  await pool.end();
}
