/**
 * OrchestrateOS control plane API — Cloudflare Worker + D1.
 * Mirrors resume_engine FastAPI endpoints for the gate explorer UI.
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { actorLabel, enforceAuth, type AuthContext } from "./auth";
import { auditEventToApi, listAuditEvents, recordAuditEvent } from "./audit";
import { DEMO_RUN_CATALOG } from "./demo-runs";
import { seedDemoRuns } from "./demo-seed";
import { DOCS_HTML, OPENAPI_SPEC } from "./docs";
import { platformApp } from "./platform/routes";
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
  API_AUTH_ENABLED?: string;
  API_KEYS_JSON?: string;
  DEMO_OPERATOR_KEY?: string;
  SESSION_SECRET?: string;
  RESEND_API_KEY?: string;
  NOTIFY_EMAIL?: string;
  ADMIN_EMAILS?: string;
  SITE_URL?: string;
};

type AppVariables = {
  auth: AuthContext;
};

type ResumeBlocker = {
  classification: string;
  step_index: number;
  step_name: string;
  failure_key: string;
  message: string;
  required_action: "compensation" | "human_approval" | "prod_resume_ack";
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

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

app.use("*", async (c, next) => {
  const origins = (c.env.CORS_ORIGINS ?? "").split(",").map((o) => o.trim()).filter(Boolean);
  return cors({
    origin: origins.length ? origins : "*",
    allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Accept", "Authorization"],
    credentials: true,
  })(c, next);
});

app.use("*", async (c, next) => {
  const denied = await enforceAuth(c);
  if (denied) return denied;
  return next();
});

app.route("/api", platformApp);

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
  await recordAuditEvent(c.env.DB, null, "demo.reset", actorLabel(c.get("auth")), result);
  return c.json({ message: "Demo runs reset", ...result });
});

app.post("/start_run", async (c) => {
  const body = await c.req.json<{
    workflow_name: string;
    run_id?: string;
    metadata?: Record<string, unknown>;
    environment?: "dev" | "staging" | "prod";
  }>();
  const runId = body.run_id ?? crypto.randomUUID();
  const environment = body.environment ?? "dev";
  if (!["dev", "staging", "prod"].includes(environment)) {
    return c.json({ detail: "environment must be dev, staging, or prod" }, 400);
  }
  const now = new Date().toISOString();
  const auth = c.get("auth");
  const tenantId = auth.tenant ?? (auth.authenticated ? "default" : "demo");
  const existing = await getRun(c.env.DB, runId);
  if (existing) {
    return c.json({ detail: `Run already exists: ${runId}` }, 409);
  }
  await c.env.DB.prepare(
    `INSERT INTO runs (run_id, workflow_name, status, environment, tenant_id, created_at, updated_at, metadata_json)
     VALUES (?, ?, 'running', ?, ?, ?, ?, ?)`,
  )
    .bind(
      runId,
      body.workflow_name,
      environment,
      tenantId,
      now,
      now,
      JSON.stringify(body.metadata ?? {}),
    )
    .run();
  await recordAuditEvent(c.env.DB, runId, "run.started", actorLabel(c.get("auth")), {
    workflow_name: body.workflow_name,
    environment,
  });
  return c.json({ run_id: runId, status: "running", environment });
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
  await recordAuditEvent(c.env.DB, runId, "run.updated", actorLabel(c.get("auth")), {
    status,
  });
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
  await recordAuditEvent(c.env.DB, runId, "step.recorded", actorLabel(c.get("auth")), {
    step_name: body.step_name,
    step_index: body.step_index,
    status: body.status,
    failure_classification: body.failure_classification ?? null,
  });
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
  await recordAuditEvent(c.env.DB, body.run_id, "run.resume_validated", actorLabel(c.get("auth")), {});
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
  await recordAuditEvent(c.env.DB, runId, "gate.compensated", actorLabel(c.get("auth")), {
    failure_key: key,
  });
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
  await recordAuditEvent(c.env.DB, runId, "gate.approved", actorLabel(c.get("auth")), {
    failure_key: key,
    approved_by: body.approved_by,
  });
  return c.json(runStatusResponse(updated!, updatedSteps, blockers));
});

app.post("/runs/:runId/ack_prod_resume", async (c) => {
  const runId = c.req.param("runId");
  const body = await c.req.json<{ acknowledged_by: string; note?: string }>();
  if (!body.acknowledged_by?.trim()) {
    return c.json({ detail: "acknowledged_by is required" }, 400);
  }
  const run = await getRun(c.env.DB, runId);
  if (!run) return c.json({ detail: `Run not found: ${runId}` }, 404);
  if ((run.environment ?? "dev") !== "prod") {
    return c.json({ detail: "Production acknowledgment only applies to prod runs" }, 400);
  }
  const metadata = parseMetadata(run.metadata_json);
  metadata.gates = metadata.gates ?? {};
  const ackAt = new Date().toISOString();
  metadata.gates.prod_resume_ack = {
    granted: true,
    acknowledged_by: body.acknowledged_by,
    acknowledged_at: ackAt,
    note: body.note ?? null,
  };
  await updateRunMetadata(c.env.DB, runId, metadata);
  const updated = await getRun(c.env.DB, runId);
  const updatedSteps = await getSteps(c.env.DB, runId);
  const blockers = getResumeBlockers(updated!, updatedSteps);
  await recordAuditEvent(c.env.DB, runId, "gate.prod_resume_ack", actorLabel(c.get("auth")), {
    acknowledged_by: body.acknowledged_by,
  });
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

app.get("/runs/:runId/audit_events", async (c) => {
  const runId = c.req.param("runId");
  const run = await getRun(c.env.DB, runId);
  if (!run) return c.json({ detail: `Run not found: ${runId}` }, 404);
  const events = await listAuditEvents(c.env.DB, runId);
  return c.json({
    run_id: runId,
    events: events.map(auditEventToApi),
  });
});

app.get("/runs/:runId/replay", async (c) => {
  const runId = c.req.param("runId");
  const run = await getRun(c.env.DB, runId);
  if (!run) return c.json({ detail: `Run not found: ${runId}` }, 404);
  const steps = await getSteps(c.env.DB, runId);
  const replayable = steps.filter(
    (s) => s.status === "completed" || s.status === "skipped_replay",
  );
  return c.json({
    run_id: runId,
    workflow_name: run.workflow_name,
    environment: run.environment ?? "dev",
    replay_from_index: 0,
    steps: replayable.map(stepToApi),
  });
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
  const gates = (parseMetadata(run.metadata_json).gates ?? {}) as Record<string, unknown>;
  const blockers: ResumeBlocker[] = [];

  if (classification === "partial") {
    if (!gates.compensations || !(gates.compensations as Record<string, unknown>)[key]) {
      blockers.push({
        classification,
        step_index: failed.step_index,
        step_name: failed.step_name,
        failure_key: key,
        message: failed.error_message ?? "Partial failure requires compensation",
        required_action: "compensation",
      });
    }
  } else if (classification === "permanent") {
    const human = gates.human_approval as
      | { failure_key?: string; granted?: boolean }
      | undefined;
    const hasApproval =
      (gates.approvals as Record<string, unknown> | undefined)?.[key] ||
      (human?.failure_key === key && human?.granted);
    if (!hasApproval) {
      blockers.push({
        classification,
        step_index: failed.step_index,
        step_name: failed.step_name,
        failure_key: key,
        message: failed.error_message ?? "Permanent failure requires human approval",
        required_action: "human_approval",
      });
    }
  }

  if (blockers.length === 0 && (run.environment ?? "dev") === "prod" && failed) {
    const prodAck = gates.prod_resume_ack as { granted?: boolean } | undefined;
    if (!prodAck?.granted) {
      blockers.push({
        classification,
        step_index: failed.step_index,
        step_name: failed.step_name,
        failure_key: key,
        message: "Production resume requires operator acknowledgment",
        required_action: "prod_resume_ack",
      });
    }
  }

  return blockers;
}

function runStatusResponse(run: RunRow, steps: StepRow[], blockers: ResumeBlocker[]) {
  const completed = steps.filter((s) => s.status === "completed");
  const lastCompleted = completed.length ? completed[completed.length - 1].step_index : null;
  const resumeFrom = lastCompleted === null ? 0 : lastCompleted + 1;

  return {
    run_id: run.run_id,
    workflow_name: run.workflow_name,
    status: run.status,
    environment: run.environment ?? "dev",
    steps_completed: completed.length,
    last_completed_step: lastCompleted,
    resume_from_index: resumeFrom,
    can_resume: blockers.length === 0,
    resume_blockers: blockers,
  };
}
