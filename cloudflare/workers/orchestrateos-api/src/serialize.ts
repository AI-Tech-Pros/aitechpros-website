/** Map D1 rows to Python-compatible resume_engine JSON shapes. */

export type RunRow = {
  run_id: string;
  workflow_name: string;
  status: string;
  environment: string;
  tenant_id?: string;
  created_at: string;
  updated_at: string;
  metadata_json: string;
};

export type StepRow = {
  id: number;
  run_id: string;
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

export function parseMetadata(json: string): Record<string, unknown> {
  try {
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export type RunMetadata = Record<string, unknown> & {
  gates?: {
    compensations?: Record<string, unknown>;
    approvals?: Record<string, unknown>;
    human_approval?: Record<string, unknown>;
    prod_resume_ack?: Record<string, unknown>;
  };
};

export function parseRunMetadata(json: string): RunMetadata {
  return parseMetadata(json) as RunMetadata;
}

export function stepToApi(step: StepRow) {
  return {
    step_name: step.step_name,
    step_index: step.step_index,
    input_data: JSON.parse(step.input_json),
    input_hash: step.input_hash,
    output_data: step.output_json ? JSON.parse(step.output_json) : null,
    status: step.status,
    idempotency_key: step.idempotency_key,
    timestamp: step.timestamp,
    failure_classification: step.failure_classification,
    error_message: step.error_message,
    sequence: step.sequence,
  };
}

export function runToApi(run: RunRow, steps: StepRow[]) {
  return {
    run_id: run.run_id,
    workflow_name: run.workflow_name,
    status: run.status,
    environment: run.environment ?? "dev",
    created_at: run.created_at,
    updated_at: run.updated_at,
    metadata: parseMetadata(run.metadata_json),
    steps: steps.map(stepToApi),
  };
}
