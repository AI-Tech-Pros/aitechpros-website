/** Append-only audit event log. */

export type AuditEventRow = {
  id: number;
  run_id: string | null;
  event_type: string;
  actor: string | null;
  payload_json: string;
  created_at: string;
};

export async function recordAuditEvent(
  db: D1Database,
  runId: string | null,
  eventType: string,
  actor: string | null,
  payload: Record<string, unknown> = {},
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO audit_events (run_id, event_type, actor, payload_json, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(runId, eventType, actor, JSON.stringify(payload), new Date().toISOString())
    .run();
}

export async function listAuditEvents(
  db: D1Database,
  runId: string,
  limit = 200,
): Promise<AuditEventRow[]> {
  const { results } = await db
    .prepare(
      `SELECT * FROM audit_events
       WHERE run_id = ?
       ORDER BY id ASC
       LIMIT ?`,
    )
    .bind(runId, limit)
    .all<AuditEventRow>();
  return results ?? [];
}

export function auditEventToApi(event: AuditEventRow) {
  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(event.payload_json) as Record<string, unknown>;
  } catch {
    payload = {};
  }
  return {
    id: event.id,
    run_id: event.run_id,
    event_type: event.event_type,
    actor: event.actor,
    payload,
    created_at: event.created_at,
  };
}
