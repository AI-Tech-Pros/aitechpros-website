-- Phase 5e: minimal nurture sequences

CREATE TABLE IF NOT EXISTS nurture_sequences (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS nurture_enrollments (
  id TEXT PRIMARY KEY,
  sequence_id TEXT NOT NULL,
  lead_id TEXT,
  partner_id TEXT,
  step_index INTEGER NOT NULL DEFAULT 0,
  next_send_at TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (sequence_id) REFERENCES nurture_sequences(id),
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);

CREATE INDEX IF NOT EXISTS idx_nurture_enrollments_due
  ON nurture_enrollments(status, next_send_at);

CREATE INDEX IF NOT EXISTS idx_nurture_enrollments_lead
  ON nurture_enrollments(lead_id, sequence_id);

INSERT OR IGNORE INTO nurture_sequences (id, name, active) VALUES
  ('welcome', 'Welcome', 1),
  ('post-demo', 'Post-demo', 1);
