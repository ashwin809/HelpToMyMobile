ALTER TABLE office_hour_bookings
  DROP CONSTRAINT IF EXISTS office_hour_bookings_office_hour_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS office_hour_bookings_one_active_slot_idx
  ON office_hour_bookings (office_hour_id)
  WHERE status IN ('requested', 'accepted');
