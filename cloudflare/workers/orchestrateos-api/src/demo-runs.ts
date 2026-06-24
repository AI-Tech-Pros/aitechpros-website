/** Fixed demo run IDs — keep in sync with cloudflare/d1/seed.sql */

export const DEMO_RUN_IDS = {
  transient: "d0000001-0000-4000-8000-000000000001",
  partial: "d0000002-0000-4000-8000-000000000002",
  permanent: "d0000003-0000-4000-8000-000000000003",
} as const;

export type DemoScenario = keyof typeof DEMO_RUN_IDS;

export const DEMO_RUN_CATALOG: {
  scenario: DemoScenario;
  run_id: string;
  label: string;
  description: string;
}[] = [
  {
    scenario: "transient",
    run_id: DEMO_RUN_IDS.transient,
    label: "Transient failure",
    description: "Prod run — transient failure still requires operator acknowledgment before resume.",
  },
  {
    scenario: "partial",
    run_id: DEMO_RUN_IDS.partial,
    label: "Partial failure",
    description: "Notification sent but DB write failed — compensation required.",
  },
  {
    scenario: "permanent",
    run_id: DEMO_RUN_IDS.permanent,
    label: "Permanent failure",
    description: "Invalid API credentials — operator approval required.",
  },
];

export const ALL_DEMO_RUN_IDS = Object.values(DEMO_RUN_IDS);
