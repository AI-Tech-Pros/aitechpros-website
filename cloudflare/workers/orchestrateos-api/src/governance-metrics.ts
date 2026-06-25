/** Tenant governance metrics from audit events and run state. */

import { getResumeBlockers } from "./resume-blockers";
import type { RunRow, StepRow } from "./serialize";

export type GovernanceMetrics = {
  tenant_id: string;
  runs_total: number;
  runs_blocked: number;
  gate_events_30d: number;
  gate_clears_30d: number;
  avg_clear_hours: number | null;
  recent_approvers: string[];
  gate_event_breakdown: Record<string, number>;
};

const GATE_CLEAR_TYPES = new Set([
  "gate.compensation",
  "gate.human_approval",
  "gate.consensus_vote",
  "gate.prod_resume_ack",
]);

export async function buildTenantGovernanceMetrics(
  db: D1Database,
  tenantId: string,
): Promise<GovernanceMetrics> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { results: runs } = await db
    .prepare(
      `SELECT * FROM runs WHERE tenant_id = ? AND tenant_id != 'demo' ORDER BY updated_at DESC LIMIT 200`,
    )
    .bind(tenantId)
    .all<RunRow>();

  const runRows = runs ?? [];
  let runsBlocked = 0;

  for (const run of runRows.slice(0, 50)) {
    const { results: steps } = await db
      .prepare(`SELECT * FROM step_records WHERE run_id = ? ORDER BY sequence ASC`)
      .bind(run.run_id)
      .all<StepRow>();
    if (getResumeBlockers(run, steps ?? []).length > 0) runsBlocked += 1;
  }

  const { results: gateEvents } = await db
    .prepare(
      `SELECT ae.event_type, ae.actor, ae.created_at, ae.run_id
       FROM audit_events ae
       INNER JOIN runs r ON r.run_id = ae.run_id
       WHERE r.tenant_id = ? AND ae.created_at >= ? AND ae.event_type LIKE 'gate.%'
       ORDER BY ae.created_at DESC
       LIMIT 500`,
    )
    .bind(tenantId, since)
    .all<{ event_type: string; actor: string | null; created_at: string; run_id: string }>();

  const events = gateEvents ?? [];
  const gateEventBreakdown: Record<string, number> = {};
  const approvers = new Set<string>();
  let gateClears = 0;

  for (const ev of events) {
    gateEventBreakdown[ev.event_type] = (gateEventBreakdown[ev.event_type] ?? 0) + 1;
    if (GATE_CLEAR_TYPES.has(ev.event_type) && ev.actor) {
      gateClears += 1;
      approvers.add(ev.actor);
    }
  }

  // Avg hours from step.failed → first gate clear per run (30d window)
  const failAtByRun = new Map<string, number>();
  const { results: failEvents } = await db
    .prepare(
      `SELECT ae.run_id, ae.created_at
       FROM audit_events ae
       INNER JOIN runs r ON r.run_id = ae.run_id
       WHERE r.tenant_id = ? AND ae.created_at >= ? AND ae.event_type = 'step.failed'`,
    )
    .bind(tenantId, since)
    .all<{ run_id: string; created_at: string }>();

  for (const row of failEvents ?? []) {
    const t = new Date(row.created_at).getTime();
    if (!failAtByRun.has(row.run_id) || t < failAtByRun.get(row.run_id)!) {
      failAtByRun.set(row.run_id, t);
    }
  }

  const clearDeltas: number[] = [];
  const clearedRuns = new Set<string>();
  for (const ev of [...events].reverse()) {
    if (!GATE_CLEAR_TYPES.has(ev.event_type) || clearedRuns.has(ev.run_id)) continue;
    const failAt = failAtByRun.get(ev.run_id);
    if (failAt === undefined) continue;
    const clearAt = new Date(ev.created_at).getTime();
    if (clearAt >= failAt) {
      clearDeltas.push((clearAt - failAt) / (1000 * 60 * 60));
      clearedRuns.add(ev.run_id);
    }
  }

  const avgClearHours =
    clearDeltas.length > 0
      ? Math.round((clearDeltas.reduce((a, b) => a + b, 0) / clearDeltas.length) * 10) / 10
      : null;

  return {
    tenant_id: tenantId,
    runs_total: runRows.length,
    runs_blocked: runsBlocked,
    gate_events_30d: events.length,
    gate_clears_30d: gateClears,
    avg_clear_hours: avgClearHours,
    recent_approvers: [...approvers].slice(0, 8),
    gate_event_breakdown: gateEventBreakdown,
  };
}

export async function buildOpsSummary(db: D1Database): Promise<{
  ingress_pending: number;
  ingress_failed: number;
  runs_blocked_total: number;
  nurture_pending: number;
}> {
  const pending = await db
    .prepare(`SELECT COUNT(*) AS c FROM ingress_events WHERE status = 'pending'`)
    .first<{ c: number }>();
  const failed = await db
    .prepare(`SELECT COUNT(*) AS c FROM ingress_events WHERE status = 'failed'`)
    .first<{ c: number }>();
  const nurture = await db
    .prepare(`SELECT COUNT(*) AS c FROM nurture_enrollments WHERE status = 'active'`)
    .first<{ c: number }>();

  const { results: activeRuns } = await db
    .prepare(`SELECT run_id FROM runs WHERE status IN ('running', 'blocked', 'failed') LIMIT 100`)
    .all<{ run_id: string }>();

  let blockedTotal = 0;
  for (const row of activeRuns ?? []) {
    const run = await db.prepare(`SELECT * FROM runs WHERE run_id = ?`).bind(row.run_id).first<RunRow>();
    if (!run) continue;
    const { results: steps } = await db
      .prepare(`SELECT * FROM step_records WHERE run_id = ?`)
      .bind(row.run_id)
      .all<StepRow>();
    if (getResumeBlockers(run, steps ?? []).length > 0) blockedTotal += 1;
  }

  return {
    ingress_pending: pending?.c ?? 0,
    ingress_failed: failed?.c ?? 0,
    runs_blocked_total: blockedTotal,
    nurture_pending: nurture?.c ?? 0,
  };
}
