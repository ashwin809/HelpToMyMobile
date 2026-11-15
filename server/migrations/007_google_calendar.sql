CREATE TABLE IF NOT EXISTS google_calendar_connections (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_ciphertext TEXT NOT NULL,
  refresh_token_iv VARCHAR(32) NOT NULL,
  refresh_token_auth_tag VARCHAR(32) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS google_calendar_oauth_states (
  state_hash CHAR(64) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS google_calendar_oauth_states_expiry_idx
  ON google_calendar_oauth_states(expires_at);

CREATE TABLE IF NOT EXISTS google_calendar_events (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES office_hour_bookings(id) ON DELETE CASCADE,
  google_event_id VARCHAR(255) NOT NULL,
  event_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, booking_id),
  UNIQUE (user_id, google_event_id)
);
