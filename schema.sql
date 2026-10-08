-- ============================================================================
-- HelpToYou Education Community Database Schema (PostgreSQL / SQLite Compatible)
-- Created for: http://helptoyou.org/
-- Description: Community Connect & Education Help Platform
-- ============================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    user_type VARCHAR(32) NOT NULL CHECK (user_type IN ('Student', 'Professor', 'Alumni', 'Sponsor', 'Volunteer', 'Applicant')),
    university VARCHAR(255),
    department VARCHAR(255),
    designation VARCHAR(150),
    education_level VARCHAR(100),
    skills TEXT, -- comma-separated or JSON array of expertise
    bio TEXT,
    avatar_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    helped_count INT DEFAULT 0,
    rating NUMERIC(3, 2) DEFAULT 5.0,
    is_regional_lead BOOLEAN DEFAULT FALSE,
    address1 VARCHAR(255),
    address2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    post_code VARCHAR(20),
    phone VARCHAR(30),
    mobile VARCHAR(30),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. INSTITUTIONS / UNIVERSITIES TABLE
CREATE TABLE IF NOT EXISTS institutions (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    institution_type VARCHAR(50) DEFAULT 'University',
    departments TEXT, -- JSON array of departments
    mentor_count INT DEFAULT 0,
    student_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. HELP REQUESTS TABLE
CREATE TABLE IF NOT EXISTS help_requests (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Admissions', 'Research', 'Syllabus & Exam', 'Scholarships', 'Career Guidance', 'General Help')),
    university VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    author_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author_name VARCHAR(200) NOT NULL,
    author_role VARCHAR(32) NOT NULL,
    urgency VARCHAR(20) DEFAULT 'Medium' CHECK (urgency IN ('Low', 'Medium', 'High')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
    tags TEXT, -- JSON or comma-separated
    response_count INT DEFAULT 0,
    upvotes INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 4. HELP RESPONSES / ADVICE THREAD TABLE
CREATE TABLE IF NOT EXISTS help_responses (
    id VARCHAR(64) PRIMARY KEY,
    request_id VARCHAR(64) NOT NULL REFERENCES help_requests(id) ON DELETE CASCADE,
    author_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author_name VARCHAR(200) NOT NULL,
    author_role VARCHAR(32) NOT NULL,
    author_university VARCHAR(255),
    author_designation VARCHAR(150),
    content TEXT NOT NULL,
    is_accepted BOOLEAN DEFAULT FALSE,
    upvotes INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. CONNECTIONS / MENTORSHIP REQUESTS TABLE
CREATE TABLE IF NOT EXISTS connections (
    id VARCHAR(64) PRIMARY KEY,
    from_user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_university ON users(university);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_requests_university ON help_requests(university);
CREATE INDEX IF NOT EXISTS idx_requests_category ON help_requests(category);
CREATE INDEX IF NOT EXISTS idx_requests_status ON help_requests(status);
CREATE INDEX IF NOT EXISTS idx_responses_request_id ON help_responses(request_id);
CREATE INDEX IF NOT EXISTS idx_connections_users ON connections(from_user_id, to_user_id);
