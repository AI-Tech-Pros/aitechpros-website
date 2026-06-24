/** Session-authenticated start_run for partner dashboard (SDK-style run). */

import { recordAuditEvent } from "../audit";

export type PartnerStartRunResult = {
  run_id: string;
  workflow_name: string;
  status: string;
  environment: string;
  tenant_id: string;
  message: string;
};

export async function createPartnerStartRun(
  db: D1Database,
  tenantId: string,
  actor: string,
  workflowName: string,
  options?: {
    environment?: "dev" | "staging" | "prod";
    metadata?: Record<string, unknown>;
  },
): Promise<PartnerStartRunResult> {
  const environment = options?.environment ?? "dev";
  if (!["dev", "staging", "prod"].includes(environment)) {
    throw new Error("environment must be dev, staging, or prod");
  }

  const runId = crypto.randomUUID();
  const now = new Date().toISOString();
  const metadata = {
    ...(options?.metadata ?? {}),
    source: "partner_dashboard",
    journey: { sdk_started_at: now },
  };

  await db
    .prepare(
      `INSERT INTO runs (run_id, workflow_name, status, environment, tenant_id, created_at, updated_at, metadata_json)
       VALUES (?, ?, 'running', ?, ?, ?, ?, ?)`,
    )
    .bind(runId, workflowName, environment, tenantId, now, now, JSON.stringify(metadata))
    .run();

  await recordAuditEvent(db, runId, "run.started", actor, {
    workflow_name: workflowName,
    environment,
    tenant_id: tenantId,
    via: "partner_session",
  });

  return {
    run_id: runId,
    workflow_name: workflowName,
    status: "running",
    environment,
    tenant_id: tenantId,
    message: "SDK-style run created. Record steps via RemoteCheckpointStore or POST /runs/{id}/steps.",
  };
}
