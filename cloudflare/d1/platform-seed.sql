-- Optional: demo design partner for portal testing (run manually after 0004)
-- Replace contact_email with a real address before magic-link testing.

INSERT OR IGNORE INTO design_partners (
  id, slug, company_name, contact_email, phase, status, milestone,
  created_at, updated_at
) VALUES (
  'dp000001-0000-4000-8000-000000000001',
  'pilot-demo',
  'Pilot Demo Co',
  'partner-demo@aitechpros.ai',
  'discovery',
  'active',
  'Integration week 1',
  '2026-06-24T12:00:00.000Z',
  '2026-06-24T12:00:00.000Z'
);
