-- OrchestrateOS resume_engine control plane (D1 / SQLite)

CREATE TABLE IF NOT EXISTS runs (
  run_id TEXT PRIMARY KEY,
  workflow_name TEXT NOT NULL,
  status TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'dev',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS step_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT NOT NULL,
  step_name TEXT NOT NULL,
  step_index INTEGER NOT NULL,
  input_json TEXT NOT NULL,
  input_hash TEXT NOT NULL,
  output_json TEXT,
  status TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  failure_classification TEXT,
  error_message TEXT,
  sequence INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (run_id) REFERENCES runs(run_id)
);

CREATE INDEX IF NOT EXISTS idx_step_records_run_id ON step_records(run_id);
CREATE INDEX IF NOT EXISTS idx_step_records_idempotency ON step_records(idempotency_key);

CREATE TABLE IF NOT EXISTS audit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT,
  event_type TEXT NOT NULL,
  actor TEXT,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_events_run_id ON audit_events(run_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit_events(created_at);
