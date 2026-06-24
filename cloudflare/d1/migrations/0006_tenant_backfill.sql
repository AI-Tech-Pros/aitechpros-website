-- Phase 5b: backfill non-demo runs incorrectly defaulted to tenant_id='demo'

UPDATE runs SET tenant_id = 'default'
WHERE run_id NOT IN (
  'd0000001-0000-4000-8000-000000000001',
  'd0000002-0000-4000-8000-000000000002',
  'd0000003-0000-4000-8000-000000000003'
) AND tenant_id = 'demo';
