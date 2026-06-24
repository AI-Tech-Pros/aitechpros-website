/** Compliance export bundle — replay, audit, gates, idempotency proof. */

import { listAuditEvents, auditEventToApi } from "./audit";
import { getResumeBlockers, runGateSummary } from "./resume-blockers";
import { parseMetadata, stepToApi, type RunRow, type StepRow } from "./serialize";

export type IdempotencyFinding = {
  type: "duplicate_completed_key" | "failed_then_completed_same_key";
  idempotency_key: string;
  step_indices: number[];
  sequences: number[];
  message: string;
};

export function analyzeIdempotency(steps: StepRow[]): IdempotencyFinding[] {
  const findings: IdempotencyFinding[] = [];
  const byKey = new Map<string, StepRow[]>();

  for (const step of steps) {
    const key = step.idempotency_key?.trim();
    if (!key) continue;
    const list = byKey.get(key) ?? [];
    list.push(step);
    byKey.set(key, list);
  }

  for (const [key, rows] of byKey) {
    if (rows.length < 2) continue;
    const completed = rows.filter((r) => r.status === "completed");
    const failed = rows.filter((r) => r.status === "failed");

    if (completed.length > 1) {
      findings.push({
        type: "duplicate_completed_key",
        idempotency_key: key,
        step_indices: rows.map((r) => r.step_index),
        sequences: rows.map((r) => r.sequence),
        message: `Idempotency key "${key}" completed ${completed.length} times — resume should skip duplicates.`,
      });
    } else if (failed.length > 0 && completed.length > 0) {
      findings.push({
        type: "failed_then_completed_same_key",
        idempotency_key: key,
        step_indices: rows.map((r) => r.step_index),
        sequences: rows.map((r) => r.sequence),
        message: `Key "${key}" failed then completed — verify compensation/approval before trusting resume.`,
      });
    }
  }

  return findings;
}

export type ComplianceExport = {
  export_version: string;
  exported_at: string;
  product: string;
  run: {
    run_id: string;
    workflow_name: string;
    status: string;
    environment: string;
    tenant_id: string;
    created_at: string;
    updated_at: string;
    metadata: Record<string, unknown>;
  };
  gate_summary: ReturnType<typeof runGateSummary>;
  gate_state: Record<string, unknown>;
  resume_blockers: ReturnType<typeof getResumeBlockers>;
  steps: ReturnType<typeof stepToApi>[];
  replay: {
    replay_from_index: number;
    step_count: number;
    steps: ReturnType<typeof stepToApi>[];
  };
  audit_events: ReturnType<typeof auditEventToApi>[];
  idempotency_analysis: {
    findings: IdempotencyFinding[];
    side_effect_safe: boolean;
    summary: string;
  };
  integrity: {
    step_count: number;
    audit_event_count: number;
    completed_steps: number;
    failed_steps: number;
  };
};

export async function buildComplianceExport(
  db: D1Database,
  run: RunRow,
  steps: StepRow[],
): Promise<ComplianceExport> {
  const events = await listAuditEvents(db, run.run_id);
  const blockers = getResumeBlockers(run, steps);
  const gateSummary = runGateSummary(run, steps);
  const metadata = parseMetadata(run.metadata_json);
  const replayable = steps.filter(
    (s) => s.status === "completed" || s.status === "skipped_replay",
  );
  const findings = analyzeIdempotency(steps);

  return {
    export_version: "1.0",
    exported_at: new Date().toISOString(),
    product: "OrchestrateOS",
    run: {
      run_id: run.run_id,
      workflow_name: run.workflow_name,
      status: run.status,
      environment: run.environment ?? "dev",
      tenant_id: run.tenant_id?.trim() || "default",
      created_at: run.created_at,
      updated_at: run.updated_at,
      metadata,
    },
    gate_summary: gateSummary,
    gate_state: (metadata.gates ?? {}) as Record<string, unknown>,
    resume_blockers: blockers,
    steps: steps.map(stepToApi),
    replay: {
      replay_from_index: 0,
      step_count: replayable.length,
      steps: replayable.map(stepToApi),
    },
    audit_events: events.map(auditEventToApi),
    idempotency_analysis: {
      findings,
      side_effect_safe: findings.length === 0,
      summary:
        findings.length === 0
          ? "No idempotency collisions detected in recorded steps."
          : `${findings.length} finding(s) require operator review before resuming.`,
    },
    integrity: {
      step_count: steps.length,
      audit_event_count: events.length,
      completed_steps: steps.filter((s) => s.status === "completed").length,
      failed_steps: steps.filter((s) => s.status === "failed").length,
    },
  };
}
