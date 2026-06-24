/** Nurture enrollments and cron tick (Phase 5e). */

import { sendEmail, type EmailEnv } from "../email";
import { renderNurtureEmail } from "./templates";

const MS_DAY = 24 * 60 * 60 * 1000;

export const SEQUENCE_WELCOME = "welcome";
export const SEQUENCE_POST_DEMO = "post-demo";

type StepDef = {
  templateId: string;
  delayMs: number;
};

const SEQUENCES: Record<string, StepDef[]> = {
  [SEQUENCE_WELCOME]: [
    { templateId: "welcome-0", delayMs: 0 },
    { templateId: "welcome-1", delayMs: 3 * MS_DAY },
  ],
  [SEQUENCE_POST_DEMO]: [{ templateId: "post-demo-0", delayMs: 1 * MS_DAY }],
};

type LeadRow = {
  id: string;
  email: string;
  name: string;
  company: string | null;
};

type EnrollmentRow = {
  id: string;
  sequence_id: string;
  lead_id: string | null;
  step_index: number;
  next_send_at: string | null;
  status: string;
};

export type NurtureEnv = EmailEnv & { DB: D1Database };

export async function enrollWelcomeSequence(db: D1Database, leadId: string): Promise<void> {
  await enrollSequence(db, SEQUENCE_WELCOME, leadId, { sendFirstImmediately: true });
}

export async function enrollPostDemoSequence(db: D1Database, leadId: string): Promise<void> {
  await enrollSequence(db, SEQUENCE_POST_DEMO, leadId, { sendFirstImmediately: false });
}

async function enrollSequence(
  db: D1Database,
  sequenceId: string,
  leadId: string,
  opts: { sendFirstImmediately: boolean },
): Promise<void> {
  const active = await db
    .prepare(`SELECT id FROM nurture_sequences WHERE id = ? AND active = 1`)
    .bind(sequenceId)
    .first();
  if (!active) return;

  const existing = await db
    .prepare(
      `SELECT id FROM nurture_enrollments
       WHERE lead_id = ? AND sequence_id = ? AND status = 'active'`,
    )
    .bind(leadId, sequenceId)
    .first();
  if (existing) return;

  const steps = SEQUENCES[sequenceId];
  if (!steps?.length) return;

  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const id = crypto.randomUUID();

  if (opts.sendFirstImmediately) {
    const lead = await loadLead(db, leadId);
    if (lead) {
      await sendStepEmail({ DB: db } as NurtureEnv, lead, steps[0].templateId);
    }
    const nextStep = steps[1];
    if (nextStep) {
      await db
        .prepare(
          `INSERT INTO nurture_enrollments (
            id, sequence_id, lead_id, step_index, next_send_at, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`,
        )
        .bind(
          id,
          sequenceId,
          leadId,
          1,
          new Date(now + nextStep.delayMs).toISOString(),
          nowIso,
          nowIso,
        )
        .run();
      return;
    }
    await db
      .prepare(
        `INSERT INTO nurture_enrollments (
          id, sequence_id, lead_id, step_index, next_send_at, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, NULL, 'complete', ?, ?)`,
      )
      .bind(id, sequenceId, leadId, steps.length, nowIso, nowIso)
      .run();
    return;
  }

  const firstDelay = steps[0].delayMs;
  await db
    .prepare(
      `INSERT INTO nurture_enrollments (
        id, sequence_id, lead_id, step_index, next_send_at, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`,
    )
    .bind(
      id,
      sequenceId,
      leadId,
      0,
      new Date(now + firstDelay).toISOString(),
      nowIso,
      nowIso,
    )
    .run();
}

export async function onLeadStageChanged(
  db: D1Database,
  leadId: string,
  previousStage: string | null,
  newStage: string,
): Promise<void> {
  if (newStage === "engaged" && previousStage !== "engaged") {
    await enrollPostDemoSequence(db, leadId);
  }
}

export async function runNurtureTick(env: NurtureEnv): Promise<{
  processed: number;
  sent: number;
  completed: number;
  errors: number;
}> {
  const nowIso = new Date().toISOString();
  const { results } = await env.DB.prepare(
    `SELECT * FROM nurture_enrollments
     WHERE status = 'active' AND next_send_at IS NOT NULL AND next_send_at <= ?
     ORDER BY next_send_at ASC
     LIMIT 50`,
  )
    .bind(nowIso)
    .all<EnrollmentRow>();

  let sent = 0;
  let completed = 0;
  let errors = 0;

  for (const row of results ?? []) {
    try {
      const steps = SEQUENCES[row.sequence_id];
      if (!steps || row.step_index >= steps.length) {
        await markComplete(env.DB, row.id);
        completed += 1;
        continue;
      }

      if (!row.lead_id) {
        await markComplete(env.DB, row.id);
        completed += 1;
        continue;
      }

      const lead = await loadLead(env.DB, row.lead_id);
      if (!lead) {
        await cancelEnrollment(env.DB, row.id);
        continue;
      }

      const step = steps[row.step_index];
      const ok = await sendStepEmail(env, lead, step.templateId);
      if (!ok && env.RESEND_API_KEY) {
        errors += 1;
        continue;
      }
      sent += 1;

      const nextIndex = row.step_index + 1;
      if (nextIndex >= steps.length) {
        await markComplete(env.DB, row.id);
        completed += 1;
      } else {
        const nextAt = new Date(Date.now() + steps[nextIndex].delayMs).toISOString();
        await env.DB.prepare(
          `UPDATE nurture_enrollments
           SET step_index = ?, next_send_at = ?, updated_at = ?
           WHERE id = ?`,
        )
          .bind(nextIndex, nextAt, nowIso, row.id)
          .run();
      }
    } catch {
      errors += 1;
    }
  }

  return {
    processed: results?.length ?? 0,
    sent,
    completed,
    errors,
  };
}

async function loadLead(db: D1Database, leadId: string): Promise<LeadRow | null> {
  return db
    .prepare(`SELECT id, email, name, company FROM leads WHERE id = ?`)
    .bind(leadId)
    .first<LeadRow>();
}

async function sendStepEmail(env: NurtureEnv, lead: LeadRow, templateId: string): Promise<boolean> {
  const rendered = renderNurtureEmail(templateId, {
    name: lead.name,
    company: lead.company,
  });
  if (!rendered) return false;
  return sendEmail(env, lead.email, rendered.subject, rendered.html);
}

async function markComplete(db: D1Database, enrollmentId: string): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `UPDATE nurture_enrollments SET status = 'complete', next_send_at = NULL, updated_at = ? WHERE id = ?`,
    )
    .bind(now, enrollmentId)
    .run();
}

async function cancelEnrollment(db: D1Database, enrollmentId: string): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `UPDATE nurture_enrollments SET status = 'cancelled', next_send_at = NULL, updated_at = ? WHERE id = ?`,
    )
    .bind(now, enrollmentId)
    .run();
}
