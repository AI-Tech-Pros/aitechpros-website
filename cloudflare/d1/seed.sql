-- Idempotent demo runs for OrchestrateOS gate explorer (Phase 1)
-- Run IDs must match cloudflare/workers/orchestrateos-api/src/demo-runs.ts

DELETE FROM step_records WHERE run_id IN (
  'd0000001-0000-4000-8000-000000000001',
  'd0000002-0000-4000-8000-000000000002',
  'd0000003-0000-4000-8000-000000000003'
);
DELETE FROM runs WHERE run_id IN (
  'd0000001-0000-4000-8000-000000000001',
  'd0000002-0000-4000-8000-000000000002',
  'd0000003-0000-4000-8000-000000000003'
);

INSERT INTO runs (run_id, workflow_name, status, created_at, updated_at, metadata_json) VALUES
  ('d0000001-0000-4000-8000-000000000001', 'demo_transient_gate', 'failed', '2026-06-24T12:00:00.000Z', '2026-06-24T12:00:00.000Z', '{}'),
  ('d0000002-0000-4000-8000-000000000002', 'demo_partial_gate', 'failed', '2026-06-24T12:00:00.000Z', '2026-06-24T12:00:00.000Z', '{}'),
  ('d0000003-0000-4000-8000-000000000003', 'demo_permanent_gate', 'failed', '2026-06-24T12:00:00.000Z', '2026-06-24T12:00:00.000Z', '{}');

-- Transient: steps 0-5 completed, step 6 failed transient
INSERT INTO step_records (run_id, step_name, step_index, input_json, input_hash, output_json, status, idempotency_key, timestamp, failure_classification, error_message, sequence) VALUES
  ('d0000001-0000-4000-8000-000000000001', 'pipeline_step_0', 0, '{}', 'demo-t-0', '{"ok":true}', 'completed', 'demo-t-0', '2026-06-24T12:00:00.000Z', NULL, NULL, 0),
  ('d0000001-0000-4000-8000-000000000001', 'pipeline_step_1', 1, '{}', 'demo-t-1', '{"ok":true}', 'completed', 'demo-t-1', '2026-06-24T12:00:00.000Z', NULL, NULL, 1),
  ('d0000001-0000-4000-8000-000000000001', 'pipeline_step_2', 2, '{}', 'demo-t-2', '{"ok":true}', 'completed', 'demo-t-2', '2026-06-24T12:00:00.000Z', NULL, NULL, 2),
  ('d0000001-0000-4000-8000-000000000001', 'pipeline_step_3', 3, '{}', 'demo-t-3', '{"ok":true}', 'completed', 'demo-t-3', '2026-06-24T12:00:00.000Z', NULL, NULL, 3),
  ('d0000001-0000-4000-8000-000000000001', 'pipeline_step_4', 4, '{}', 'demo-t-4', '{"ok":true}', 'completed', 'demo-t-4', '2026-06-24T12:00:00.000Z', NULL, NULL, 4),
  ('d0000001-0000-4000-8000-000000000001', 'pipeline_step_5', 5, '{}', 'demo-t-5', '{"ok":true}', 'completed', 'demo-t-5', '2026-06-24T12:00:00.000Z', NULL, NULL, 5),
  ('d0000001-0000-4000-8000-000000000001', 'call_llm', 6, '{}', 'demo-t-6', NULL, 'failed', 'demo-t-6', '2026-06-24T12:00:00.000Z', 'transient', 'Upstream timeout after 30s', 6);

-- Partial: steps 0-5 completed, step 6 failed partial
INSERT INTO step_records (run_id, step_name, step_index, input_json, input_hash, output_json, status, idempotency_key, timestamp, failure_classification, error_message, sequence) VALUES
  ('d0000002-0000-4000-8000-000000000002', 'pipeline_step_0', 0, '{}', 'demo-p-0', '{"ok":true}', 'completed', 'demo-p-0', '2026-06-24T12:00:00.000Z', NULL, NULL, 0),
  ('d0000002-0000-4000-8000-000000000002', 'pipeline_step_1', 1, '{}', 'demo-p-1', '{"ok":true}', 'completed', 'demo-p-1', '2026-06-24T12:00:00.000Z', NULL, NULL, 1),
  ('d0000002-0000-4000-8000-000000000002', 'pipeline_step_2', 2, '{}', 'demo-p-2', '{"ok":true}', 'completed', 'demo-p-2', '2026-06-24T12:00:00.000Z', NULL, NULL, 2),
  ('d0000002-0000-4000-8000-000000000002', 'pipeline_step_3', 3, '{}', 'demo-p-3', '{"ok":true}', 'completed', 'demo-p-3', '2026-06-24T12:00:00.000Z', NULL, NULL, 3),
  ('d0000002-0000-4000-8000-000000000002', 'pipeline_step_4', 4, '{}', 'demo-p-4', '{"ok":true}', 'completed', 'demo-p-4', '2026-06-24T12:00:00.000Z', NULL, NULL, 4),
  ('d0000002-0000-4000-8000-000000000002', 'pipeline_step_5', 5, '{}', 'demo-p-5', '{"ok":true}', 'completed', 'demo-p-5', '2026-06-24T12:00:00.000Z', NULL, NULL, 5),
  ('d0000002-0000-4000-8000-000000000002', 'send_notification', 6, '{}', 'demo-p-6', NULL, 'failed', 'demo-p-6', '2026-06-24T12:00:00.000Z', 'partial', 'Email sent but database write failed', 6);

-- Permanent: steps 0-1 completed, step 2 failed permanent
INSERT INTO step_records (run_id, step_name, step_index, input_json, input_hash, output_json, status, idempotency_key, timestamp, failure_classification, error_message, sequence) VALUES
  ('d0000003-0000-4000-8000-000000000003', 'load_config', 0, '{}', 'demo-m-0', '{"ok":true}', 'completed', 'demo-m-0', '2026-06-24T12:00:00.000Z', NULL, NULL, 0),
  ('d0000003-0000-4000-8000-000000000003', 'fetch_claim', 1, '{}', 'demo-m-1', '{"ok":true}', 'completed', 'demo-m-1', '2026-06-24T12:00:00.000Z', NULL, NULL, 1),
  ('d0000003-0000-4000-8000-000000000003', 'validate_credentials', 2, '{}', 'demo-m-2', NULL, 'failed', 'demo-m-2', '2026-06-24T12:00:00.000Z', 'permanent', 'Invalid API credentials — rotation required', 2);
