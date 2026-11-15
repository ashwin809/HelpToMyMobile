CREATE TABLE IF NOT EXISTS study_circle_posts (
  id UUID PRIMARY KEY,
  circle_id UUID NOT NULL REFERENCES study_circles(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content VARCHAR(2000) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS study_circle_posts_feed_idx ON study_circle_posts(circle_id,created_at DESC,id DESC);
