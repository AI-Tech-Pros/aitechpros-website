/**
 * OrchestrateOS control plane API — Cloudflare Worker + D1.
 * Mirrors resume_engine FastAPI endpoints for the gate explorer UI.
 */

import { Hono } from "hono";
import { cors } from "hono/cors";

export type Env = {
  DB: D1Database;
  CORS_ORIGINS?: string;
};

type RunRow = {
  run_id: string;
  workflow_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  metadata_json: string;
};

type StepRow = {
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

type ResumeBlocker = {
  classification: string;
  step_index: number;
  step_name: string;
  failure_key: string;
  message: string;
  required_action: string;
};

const app = new Hono<{ Bindings: Env }>();

app.use("*", async (c, next) => {
  const origins = (c.env.CORS_ORIGINS ?? "").split(",").map((o) => o.trim()).filter(Boolean);
  return cors({
    origin: origins.length ? origins : "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Accept"],
    credentials: true,
  })(c, next);
});

app.get("/health", (c) =>
  c.json({ status: "ok", service: "orchestrateos-api", platform: "cloudflare-workers" }),
);

app.get("/", (c) =>
  c.json({
    product: "OrchestrateOS",
    component: "resume_engine-api",
    platform: "cloudflare-workers",
    health: "/health",
  }),
);

app.post("/start_run", async (c) => {
  const body = await c.req.json<{ workflow_name: string; metadata?: Record<string, unknown> }>();
  const runId = crypto.randomUUID();
  const now = new Date().toISOString();
  await c.env.DB.prepare(
    `INSERT INTO runs (run_id, workflow_name, status, created_at, updated_at, metadata_json)
     VALUES (?, ?, 'running', ?, ?, ?)`,
  )
    .bind(runId, body.workflow_name, now, now, JSON.stringify(body.metadata ?? {}))
    .run();
  return c.json({ run_id: runId, status: "running" });
});

app.get("/runs/:runId/status", async (c) => {
  const runId = c.req.param("runId");
  const run = await getRun(c.env.DB, runId);
  if (!run) return c.json({ detail: `Run not found: ${runId}` }, 404);
  const steps = await getSteps(c.env.DB, runId);
  const blockers = getResumeBlockers(run, steps);
  return c.json(runStatusResponse(run, steps, blockers));
});

app.get("/runs/:runId/resume_blockers", async (c) => {
  const runId = c.req.param("runId");
  const run = await getRun(c.env.DB, runId);
  if (!run) return c.json({ detail: `Run not found: ${runId}` }, 404);
  const steps = await getSteps(c.env.DB, runId);
  const blockers = getResumeBlockers(run, steps);
  return c.json({ run_id: runId, can_resume: blockers.length === 0, blockers });
});

app.post("/resume", async (c) => {
  const body = await c.req.json<{ run_id: string }>();
  const run = await getRun(c.env.DB, body.run_id);
  if (!run) return c.json({ detail: `Run not found: ${body.run_id}` }, 404);
  const steps = await getSteps(c.env.DB, body.run_id);
  const blockers = getResumeBlockers(run, steps);
  if (blockers.length > 0) {
    return c.json(
      { message: "Resume blocked by failure gates", blockers },
      409,
    );
  }
  return c.json(runStatusResponse(run, steps, []));
});

app.post("/runs/:runId/compensate", async (c) => {
  const runId = c.req.param("runId");
  const body = await c.req.json<{ result?: Record<string, unknown>; note?: string }>();
  const run = await getRun(c.env.DB, runId);
  if (!run) return c.json({ detail: `Run not found: ${runId}` }, 404);
  const steps = await getSteps(c.env.DB, runId);
  const failed = lastFailedStep(steps);
  if (!failed || failed.failure_classification !== "partial") {
    return c.json({ detail: "No partial failure awaiting compensation" }, 400);
  }
  const metadata = parseMetadata(run.metadata_json);
  const key = failureKey(failed);
  metadata.gates = metadata.gates ?? {};
  metadata.gates.compensations = metadata.gates.compensations ?? {};
  metadata.gates.compensations[key] = { result: body.result ?? {}, note: body.note ?? null };
  await updateRunMetadata(c.env.DB, runId, metadata);
  const updated = await getRun(c.env.DB, runId);
  const updatedSteps = await getSteps(c.env.DB, runId);
  const blockers = getResumeBlockers(updated!, updatedSteps);
  return c.json(runStatusResponse(updated!, updatedSteps, blockers));
});

app.post("/runs/:runId/approve", async (c) => {
  const runId = c.req.param("runId");
  const body = await c.req.json<{ approved_by: string; note?: string }>();
  if (!body.approved_by?.trim()) {
    return c.json({ detail: "approved_by is required" }, 400);
  }
  const run = await getRun(c.env.DB, runId);
  if (!run) return c.json({ detail: `Run not found: ${runId}` }, 404);
  const steps = await getSteps(c.env.DB, runId);
  const failed = lastFailedStep(steps);
  if (!failed || failed.failure_classification !== "permanent") {
    return c.json({ detail: "No permanent failure awaiting approval" }, 400);
  }
  const metadata = parseMetadata(run.metadata_json);
  const key = failureKey(failed);
  metadata.gates = metadata.gates ?? {};
  metadata.gates.approvals = metadata.gates.approvals ?? {};
  metadata.gates.approvals[key] = {
    approved_by: body.approved_by,
    note: body.note ?? null,
    at: new Date().toISOString(),
  };
  await updateRunMetadata(c.env.DB, runId, metadata);
  const updated = await getRun(c.env.DB, runId);
  const updatedSteps = await getSteps(c.env.DB, runId);
  return c.json(runStatusResponse(updated!, updatedSteps, []));
});

app.get("/runs/:runId/audit_log", async (c) => {
  const runId = c.req.param("runId");
  const run = await getRun(c.env.DB, runId);
  if (!run) return c.json({ detail: `Run not found: ${runId}` }, 404);
  const steps = await getSteps(c.env.DB, runId);
  const trace = steps
    .map(
      (s) =>
        `[${s.timestamp}] step=${s.step_index}:${s.step_name} status=${s.status}` +
        (s.error_message ? ` error=${s.error_message}` : ""),
    )
    .join("\n");
  return c.json({ run_id: runId, audit_trace: trace || "(no steps recorded)" });
});

export default app;

async function getRun(db: D1Database, runId: string): Promise<RunRow | null> {
  return db.prepare("SELECT * FROM runs WHERE run_id = ?").bind(runId).first<RunRow>();
}

async function getSteps(db: D1Database, runId: string): Promise<StepRow[]> {
  const { results } = await db
    .prepare("SELECT * FROM step_records WHERE run_id = ? ORDER BY sequence ASC")
    .bind(runId)
    .all<StepRow>();
  return results ?? [];
}

async function updateRunMetadata(
  db: D1Database,
  runId: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  await db
    .prepare("UPDATE runs SET metadata_json = ?, updated_at = ? WHERE run_id = ?")
    .bind(JSON.stringify(metadata), new Date().toISOString(), runId)
    .run();
}

function parseMetadata(json: string): Record<string, any> {
  try {
    return JSON.parse(json) as Record<string, any>;
  } catch {
    return {};
  }
}

function failureKey(step: StepRow): string {
  return `${step.step_index}:${step.sequence}`;
}

function lastFailedStep(steps: StepRow[]): StepRow | null {
  for (let i = steps.length - 1; i >= 0; i--) {
    if (steps[i].status === "failed") return steps[i];
  }
  return null;
}

function getResumeBlockers(run: RunRow, steps: StepRow[]): ResumeBlocker[] {
  if (run.status !== "failed" && run.status !== "paused") return [];
  const failed = lastFailedStep(steps);
  if (!failed?.failure_classification) return [];

  const classification = failed.failure_classification;
  const key = failureKey(failed);
  const gates = parseMetadata(run.metadata_json).gates ?? {};

  if (classification === "transient") return [];

  if (classification === "partial") {
    if (gates.compensations?.[key]) return [];
    return [
      {
        classification,
        step_index: failed.step_index,
        step_name: failed.step_name,
        failure_key: key,
        message: failed.error_message ?? "Partial failure requires compensation",
        required_action: "compensation",
      },
    ];
  }

  if (classification === "permanent") {
    if (gates.approvals?.[key]) return [];
    return [
      {
        classification,
        step_index: failed.step_index,
        step_name: failed.step_name,
        failure_key: key,
        message: failed.error_message ?? "Permanent failure requires human approval",
        required_action: "human_approval",
      },
    ];
  }

  return [];
}

function runStatusResponse(run: RunRow, steps: StepRow[], blockers: ResumeBlocker[]) {
  const completed = steps.filter((s) => s.status === "completed");
  const lastCompleted = completed.length
    ? completed[completed.length - 1].step_index
    : null;
  const resumeFrom =
    lastCompleted === null ? 0 : lastCompleted + 1;

  return {
    run_id: run.run_id,
    workflow_name: run.workflow_name,
    status: run.status,
    steps_completed: completed.length,
    last_completed_step: lastCompleted,
    resume_from_index: resumeFrom,
    can_resume: blockers.length === 0,
    resume_blockers: blockers,
  };
}
