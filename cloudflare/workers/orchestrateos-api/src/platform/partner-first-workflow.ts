/** Partner sample workflow — session-auth, no runner key required in browser. */

import { recordAuditEvent } from "../audit";

export type PartnerFirstWorkflowResult = {
  run_id: string;
  workflow_name: string;
  status: string;
  environment: string;
  tenant_id: string;
  message: string;
};

export async function createPartnerFirstWorkflow(
  db: D1Database,
  tenantId: string,
  actor: string,
): Promise<PartnerFirstWorkflowResult> {
  const runId = crypto.randomUUID();
  const now = new Date().toISOString();
  const workflowName = "partner_first_workflow";
  const metadata = {
    journey: {
      first_workflow_at: now,
      partner_sample: true,
      checklist_completed: false,
    },
    source: "partner_dashboard",
  };

  await db
    .prepare(
      `INSERT INTO runs (run_id, workflow_name, status, environment, tenant_id, created_at, updated_at, metadata_json)
       VALUES (?, ?, 'running', 'dev', ?, ?, ?, ?)`,
    )
    .bind(runId, workflowName, tenantId, now, now, JSON.stringify(metadata))
    .run();

  const inputJson = JSON.stringify({ sample: true, tenant_id: tenantId });
  const inputHash = await hashText(inputJson);

  await db
    .prepare(
      `INSERT INTO step_records (
        run_id, step_name, step_index, input_json, input_hash, output_json,
        status, idempotency_key, timestamp, failure_classification, error_message, sequence
      ) VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, ?, NULL, NULL, ?)`,
    )
    .bind(
      runId,
      "ingest",
      0,
      inputJson,
      inputHash,
      JSON.stringify({ validated: true, message: "Partner sample workflow started" }),
      `${runId}:ingest`,
      now,
      0,
    )
    .run();

  await db
    .prepare("UPDATE runs SET status = ?, updated_at = ? WHERE run_id = ?")
    .bind("completed", now, runId)
    .run();

  await recordAuditEvent(db, runId, "partner.first_workflow", actor, {
    tenant_id: tenantId,
    workflow_name: workflowName,
  });

  return {
    run_id: runId,
    workflow_name: workflowName,
    status: "completed",
    environment: "dev",
    tenant_id: tenantId,
    message: "Sample workflow created. Open Gate explorer to inspect checkpoints.",
  };
}

async function hashText(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
