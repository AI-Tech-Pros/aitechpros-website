/**
 * OrchestrateOS control plane API — Cloudflare Worker + D1.
 * Mirrors resume_engine FastAPI endpoints for the gate explorer UI.
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { DEMO_RUN_CATALOG } from "./demo-runs";
import { seedDemoRuns } from "./demo-seed";
import { DOCS_HTML, OPENAPI_SPEC } from "./docs";
import {
  parseMetadata,
  runToApi,
  stepToApi,
  type RunRow,
  type StepRow,
} from "./serialize";

export type Env = {
  DB: D1Database;
  CORS_ORIGINS?: string;
};

type ResumeBlocker = {
  classification: string;
  step_index: number;
  step_name: string;
  failure_key: string;
  message: string;
  required_action: string;
};

type RecordStepBody = {
  step_name: string;
  step_index: number;
  status: "completed" | "failed" | "skipped_replay";
  input_json?: Record<string, unknown>;
  output_json?: Record<string, unknown> | null;
  failure_classification?: "transient" | "partial" | "permanent" | null;
  error_message?: string | null;
  sequence?: number;
  idempotency_key?: string;
};

const app = new Hono<{ Bindings: Env }>();

app.use("*", async (c, next) => {
  const origins = (c.env.CORS_ORIGINS ?? "").split(",").map((o) => o.trim()).filter(Boolean);
  return cors({
    origin: origins.length ? origins : "*",
    allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Accept"],
    credentials: true,
  })(c, next);
});

app.get("/health", (c) =>
  c.json({ status: "ok", service: "orchestrateos-api", platform: "cloudflare-workers" }),
);

app.get("/docs", (c) => c.html(DOCS_HTML));

app.get("/openapi.json", (c) => c.json(OPENAPI_SPEC));

app.get("/", (c) =>
  c.json({
    product: "OrchestrateOS",
    component: "resume_engine-api",
    platform: "cloudflare-workers",
    docs: "/docs",
    health: "/health",
    demo_runs: "/demo/runs",
  }),
);

app.get("/demo/runs", (c) => c.json({ runs: DEMO_RUN_CATALOG }));

app.post("/demo/reset", async (c) => {
  const result = await seedDemoRuns(c.env.DB);
  return c.json({ message: "Demo runs reset", ...result });
});

app.post("/start_run", async (c) => {
  const body = await c.req.json<{
    workflow_name: string;
    run_id?: string;
    metadata?: Record<string, unknown>;
  }>();
  const runId = body.run_id ?? crypto.randomUUID();
  const now = new Date().toISOString();
  const existing = await getRun(c.env.DB, runId);
  if (existing) {
    return c.json({ detail: `Run already exists: ${runId}` }, 409);
  }
  await c.env.DB.prepare(
    `INSERT INTO runs (run_id, workflow_name, status, created_at, updated_at, metadata_json)
     VALUES (?, ?, 'running', ?, ?, ?)`,
  )
    .bind(runId, body.workflow_name, now, now, JSON.stringify(body.metadata ?? {}))
    .run();
  return c.json({ run_id: runId, status: "running" });
});

app.get("/runs/:runId", async (c) => {
  const runId = c.req.param("runId");
  const run = await getRun(c.env.DB, runId);
  if (!run) return c.json({ detail: `Run not found: ${runId}` }, 404);
  const steps = await getSteps(c.env.DB, runId);
  return c.json(runToApi(run, steps));
});

app.patch("/runs/:runId", async (c) => {
  const runId = c.req.param("runId");
  const body = await c.req.json<{ status?: string; metadata?: Record<string, unknown> }>();
  const run = await getRun(c.env.DB, runId);
  if (!run) return c.json({ detail: `Run not found: ${runId}` }, 404);
  const status = body.status ?? run.status;
  const metadata =
    body.metadata !== undefined ? body.metadata : parseMetadata(run.metadata_json);
  const now = new Date().toISOString();
  await c.env.DB.prepare(
    "UPDATE runs SET status = ?, metadata_json = ?, updated_at = ? WHERE run_id = ?",
  )
    .bind(status, JSON.stringify(metadata), now, runId)
    .run();
  const updated = await getRun(c.env.DB, runId);
  const steps = await getSteps(c.env.DB, runId);
  return c.json(runToApi(updated!, steps));
});

app.get("/idempotency/:key", async (c) => {
  const key = c.req.param("key");
  const row = await c.env.DB.prepare(
    `SELECT * FROM step_records
     WHERE idempotency_key = ?
       AND status IN ('completed', 'skipped_replay')
     ORDER BY sequence DESC
     LIMIT 1`,
  )
    .bind(key)
    .first<StepRow>();
  if (!row) return c.json({ detail: "Idempotency key not found" }, 404);
  return c.json(stepToApi(row));
});

app.post("/runs/:runId/steps", async (c) => {
  const runId = c.req.param("runId");
  const body = await c.req.json<RecordStepBody>();
  const run = await getRun(c.env.DB, runId);
  if (!run) return c.json({ detail: `Run not found: ${runId}` }, 404);

  const steps = await getSteps(c.env.DB, runId);
  const sequence = body.sequence ?? steps.length;
  const inputJson = JSON.stringify(body.input_json ?? {});
  const inputHash = await hashText(inputJson);
  const outputJson =
    body.output_json === undefined ? null : JSON.stringify(body.output_json);
  const now = new Date().toISOString();
  const idempotencyKey =
    body.idempotency_key ?? `${runId}:${body.step_index}:${sequence}`;

  await c.env.DB.prepare(
    `INSERT INTO step_records (
      run_id, step_name, step_index, input_json, input_hash, output_json,
      status, idempotency_key, timestamp, failure_classification, error_message, sequence
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      runId,
      body.step_name,
      body.step_index,
      inputJson,
      inputHash,
      outputJson,
      body.status,
      idempotencyKey,
      now,
      body.failure_classification ?? null,
      body.error_message ?? null,
      sequence,
    )
    .run();

  const runStatus =
    body.status === "failed"
      ? "failed"
      : run.status === "failed"
        ? run.status
        : "running";

  await c.env.DB.prepare("UPDATE runs SET status = ?, updated_at = ? WHERE run_id = ?")
    .bind(runStatus, now, runId)
    .run();

  const updated = await getRun(c.env.DB, runId);
  const updatedSteps = await getSteps(c.env.DB, runId);
  const blockers = getResumeBlockers(updated!, updatedSteps);
  return c.json(runStatusResponse(updated!, updatedSteps, blockers), 201);
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
    return c.json({ message: "Resume blocked by failure gates", blockers }, 409);
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
  const approvedAt = new Date().toISOString();
  metadata.gates.approvals[key] = {
    approved_by: body.approved_by,
    note: body.note ?? null,
    at: approvedAt,
  };
  metadata.gates.human_approval = {
    granted: true,
    failure_key: key,
    approved_by: body.approved_by,
    approved_at: approvedAt,
    note: body.note ?? null,
  };
  await updateRunMetadata(c.env.DB, runId, metadata);
  const updated = await getRun(c.env.DB, runId);
  const updatedSteps = await getSteps(c.env.DB, runId);
  const blockers = getResumeBlockers(updated!, updatedSteps);
  return c.json(runStatusResponse(updated!, updatedSteps, blockers));
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

async function hashText(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

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
    const human = gates.human_approval as
      | { failure_key?: string; granted?: boolean }
      | undefined;
    if (human?.failure_key === key && human?.granted) return [];
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
  const lastCompleted = completed.length ? completed[completed.length - 1].step_index : null;
  const resumeFrom = lastCompleted === null ? 0 : lastCompleted + 1;

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
