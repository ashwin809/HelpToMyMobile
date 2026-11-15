ALTER TABLE users
  ADD COLUMN IF NOT EXISTS user_roles VARCHAR(32)[] NOT NULL DEFAULT ARRAY['Student']::VARCHAR(32)[];

UPDATE users
SET user_roles = ARRAY[user_type]::VARCHAR(32)[]
WHERE user_roles = ARRAY['Student']::VARCHAR(32)[] AND user_type <> 'Student';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_user_roles_valid') THEN
    ALTER TABLE users ADD CONSTRAINT users_user_roles_valid
      CHECK (cardinality(user_roles) BETWEEN 1 AND 6
        AND user_roles <@ ARRAY['Student','Professor','Alumni','Sponsor','Volunteer','Applicant']::VARCHAR(32)[]);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS chat_messages_unread_thread_idx
  ON chat_messages(thread_id, created_at DESC)
  WHERE is_read = FALSE;
