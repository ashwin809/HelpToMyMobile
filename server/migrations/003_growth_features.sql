ALTER TABLE users ALTER COLUMN avatar_url TYPE TEXT;
ALTER TABLE help_requests ADD COLUMN IF NOT EXISTS accepted_response_id UUID REFERENCES help_responses(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS study_circles (
  id UUID PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  topic VARCHAR(100) NOT NULL,
  description VARCHAR(1000) NOT NULL,
  university VARCHAR(255),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS study_circle_members (
  circle_id UUID NOT NULL REFERENCES study_circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (circle_id, user_id)
);

CREATE TABLE IF NOT EXISTS mentor_office_hours (
  id UUID PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(160) NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  meeting_url TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (ends_at > starts_at)
);
CREATE TABLE IF NOT EXISTS office_hour_bookings (
  id UUID PRIMARY KEY,
  office_hour_id UUID NOT NULL UNIQUE REFERENCES mentor_office_hours(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note VARCHAR(1000),
  status VARCHAR(20) NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','accepted','declined','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  organization VARCHAR(160) NOT NULL,
  kind VARCHAR(40) NOT NULL CHECK (kind IN ('Scholarship','Internship','Research','Competition','Other')),
  description VARCHAR(2000) NOT NULL,
  eligibility VARCHAR(500),
  deadline DATE,
  apply_url TEXT,
  university VARCHAR(255),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS saved_opportunities (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, opportunity_id)
);

CREATE TABLE IF NOT EXISTS learning_goals (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(160) NOT NULL,
  category VARCHAR(40) NOT NULL DEFAULT 'Study',
  due_date DATE,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS learning_goals_user_idx ON learning_goals(user_id, due_date NULLS LAST, created_at DESC);

CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  description VARCHAR(1200) NOT NULL,
  category VARCHAR(60) NOT NULL,
  url TEXT NOT NULL,
  university VARCHAR(255),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
