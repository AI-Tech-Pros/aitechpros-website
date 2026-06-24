import type { KernelEnv } from "./execute";

export type IngressSource = "webhook" | "queue" | "human";

export async function recordIngressEvent(
  env: KernelEnv,
  tenantId: string,
  source: IngressSource,
  payload: Record<string, unknown>,
  sourceId?: string,
): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO ingress_events (id, tenant_id, source, source_id, payload_json, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
  )
    .bind(id, tenantId, source, sourceId ?? null, JSON.stringify(payload), now)
    .run();
  return id;
}

export async function markIngressProcessed(
  env: KernelEnv,
  ingressId: string,
  runId: string,
  status: "completed" | "failed",
): Promise<void> {
  await env.DB.prepare(
    `UPDATE ingress_events SET status = ?, run_id = ?, processed_at = ? WHERE id = ?`,
  )
    .bind(status, runId, new Date().toISOString(), ingressId)
    .run();
}

export function extractGoalFromPayload(payload: Record<string, unknown>): string {
  const goal = payload.goal ?? payload.message ?? payload.intent;
  if (typeof goal === "string" && goal.trim()) return goal.trim();
  return JSON.stringify(payload).slice(0, 2000);
}
