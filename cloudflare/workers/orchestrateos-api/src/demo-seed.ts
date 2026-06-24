import { ALL_DEMO_RUN_IDS, DEMO_RUN_IDS } from "./demo-runs";

type StepSeed = {
  step_name: string;
  step_index: number;
  input_json: string;
  input_hash: string;
  output_json: string | null;
  status: string;
  idempotency_key: string;
  timestamp: string;
  failure_classification: string | null;
  error_message: string | null;
  sequence: number;
};

const TS = "2026-06-24T12:00:00.000Z";

function completedStep(
  runId: string,
  stepIndex: number,
  name: string,
  sequence: number,
): StepSeed {
  return {
    step_name: name,
    step_index: stepIndex,
    input_json: "{}",
    input_hash: `demo-${runId}-${sequence}`,
    output_json: '{"ok":true}',
    status: "completed",
    idempotency_key: `demo-${runId}-${sequence}`,
    timestamp: TS,
    failure_classification: null,
    error_message: null,
    sequence,
  };
}

function failedStep(
  runId: string,
  stepIndex: number,
  name: string,
  sequence: number,
  classification: string,
  message: string,
): StepSeed {
  return {
    step_name: name,
    step_index: stepIndex,
    input_json: "{}",
    input_hash: `demo-${runId}-${sequence}`,
    output_json: null,
    status: "failed",
    idempotency_key: `demo-${runId}-${sequence}`,
    timestamp: TS,
    failure_classification: classification,
    error_message: message,
    sequence,
  };
}

const DEMO_STEPS: Record<string, StepSeed[]> = {
  [DEMO_RUN_IDS.transient]: [
    ...Array.from({ length: 6 }, (_, i) =>
      completedStep(DEMO_RUN_IDS.transient, i, `pipeline_step_${i}`, i),
    ),
    failedStep(
      DEMO_RUN_IDS.transient,
      6,
      "call_llm",
      6,
      "transient",
      "Upstream timeout after 30s",
    ),
  ],
  [DEMO_RUN_IDS.partial]: [
    ...Array.from({ length: 6 }, (_, i) =>
      completedStep(DEMO_RUN_IDS.partial, i, `pipeline_step_${i}`, i),
    ),
    failedStep(
      DEMO_RUN_IDS.partial,
      6,
      "send_notification",
      6,
      "partial",
      "Email sent but database write failed",
    ),
  ],
  [DEMO_RUN_IDS.permanent]: [
    completedStep(DEMO_RUN_IDS.permanent, 0, "load_config", 0),
    completedStep(DEMO_RUN_IDS.permanent, 1, "fetch_claim", 1),
    failedStep(
      DEMO_RUN_IDS.permanent,
      2,
      "validate_credentials",
      2,
      "permanent",
      "Invalid API credentials — rotation required",
    ),
  ],
};

const DEMO_RUNS: { run_id: string; workflow_name: string; status: string; environment: string }[] = [
  {
    run_id: DEMO_RUN_IDS.transient,
    workflow_name: "demo_transient_gate",
    status: "failed",
    environment: "prod",
  },
  {
    run_id: DEMO_RUN_IDS.partial,
    workflow_name: "demo_partial_gate",
    status: "failed",
    environment: "dev",
  },
  {
    run_id: DEMO_RUN_IDS.permanent,
    workflow_name: "demo_permanent_gate",
    status: "failed",
    environment: "dev",
  },
];

async function insertStep(db: D1Database, runId: string, step: StepSeed): Promise<void> {
  await db
    .prepare(
      `INSERT INTO step_records (
        run_id, step_name, step_index, input_json, input_hash, output_json,
        status, idempotency_key, timestamp, failure_classification, error_message, sequence
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      runId,
      step.step_name,
      step.step_index,
      step.input_json,
      step.input_hash,
      step.output_json,
      step.status,
      step.idempotency_key,
      step.timestamp,
      step.failure_classification,
      step.error_message,
      step.sequence,
    )
    .run();
}

/** Idempotent seed for the three canonical gate-explorer demo runs. */
export async function seedDemoRuns(db: D1Database): Promise<{ seeded: number }> {
  for (const runId of ALL_DEMO_RUN_IDS) {
    await db.prepare("DELETE FROM step_records WHERE run_id = ?").bind(runId).run();
    await db.prepare("DELETE FROM runs WHERE run_id = ?").bind(runId).run();
  }

  for (const run of DEMO_RUNS) {
    await db
      .prepare(
        `INSERT INTO runs (run_id, workflow_name, status, environment, tenant_id, created_at, updated_at, metadata_json)
         VALUES (?, ?, ?, ?, 'demo', ?, ?, '{}')`,
      )
      .bind(run.run_id, run.workflow_name, run.status, run.environment, TS, TS)
      .run();

    for (const step of DEMO_STEPS[run.run_id] ?? []) {
      await insertStep(db, run.run_id, step);
    }
  }

  return { seeded: DEMO_RUNS.length };
}
