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

export async function processIngressQueue(
  env: KernelEnv,
  limit = 5,
): Promise<{ processed: number; run_ids: string[] }> {
  const { results } = await env.DB.prepare(
    `SELECT * FROM ingress_events WHERE status = 'pending' AND source = 'queue'
     ORDER BY created_at ASC LIMIT ?`,
  )
    .bind(limit)
    .all<{
      id: string;
      tenant_id: string;
      payload_json: string;
    }>();

  const runIds: string[] = [];
  for (const row of results ?? []) {
    await env.DB.prepare(`UPDATE ingress_events SET status = 'processing' WHERE id = ?`)
      .bind(row.id)
      .run();
    runIds.push(row.id);
  }
  return { processed: runIds.length, run_ids: runIds };
}

export function extractGoalFromPayload(payload: Record<string, unknown>): string {
  const goal = payload.goal ?? payload.message ?? payload.intent;
  if (typeof goal === "string" && goal.trim()) return goal.trim();
  return JSON.stringify(payload).slice(0, 2000);
}
