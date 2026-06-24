import { recordAuditEvent } from "../audit";
import { getResumeBlockers } from "../resume-blockers";
import type { RunRow, StepRow } from "../serialize";
import { parseMetadata } from "../serialize";
import { KERNEL_AGENTS, KERNEL_MODEL, stepNameForAgent, type KernelAgentId } from "./agents";
import { recordIngressEvent, markIngressProcessed, extractGoalFromPayload, type IngressSource } from "./ingress";
import { parseJsonFromLlm } from "./json";
import { runKernelLlm } from "./llm";
import { invokeKernelTool, KERNEL_TOOLS } from "./tools";
import {
  assertRunBudget,
  getRunBudgetUsd,
  getRunSpentUsd,
  getUsageSummary,
  LlmBudgetExceededError,
  recordLlmUsage,
} from "./usage";
import type { LlmEnv } from "../llm/env";

export type KernelEnv = LlmEnv & {
  DB: D1Database;
  SITE_URL?: string;
  LLM_BUDGET_USD_PER_RUN?: string;
  INGRESS_WEBHOOK_SECRET?: string;
};

export type KernelAgentResult = {
  id: KernelAgentId;
  name: string;
  step_index: number;
  output: string;
  model: string;
  provider?: string;
  tool_invoked?: string;
};

export type KernelRunResult = {
  run_id: string;
  workflow_name: string;
  status: string;
  model: string;
  agents: KernelAgentResult[];
  gated?: boolean;
  blockers?: ReturnType<typeof getResumeBlockers>;
  usage?: Awaited<ReturnType<typeof getUsageSummary>>;
  ingress_event_id?: string;
};

type PipelineContext = {
  goal: string;
  context: string[];
  plannedSteps: { name: string; depends_on?: string; description?: string }[];
  metadata: Record<string, unknown>;
};

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
  status?: string,
): Promise<void> {
  const now = new Date().toISOString();
  if (status) {
    await db
      .prepare("UPDATE runs SET metadata_json = ?, status = ?, updated_at = ? WHERE run_id = ?")
      .bind(JSON.stringify(metadata), status, now, runId)
      .run();
  } else {
    await db
      .prepare("UPDATE runs SET metadata_json = ?, updated_at = ? WHERE run_id = ?")
      .bind(JSON.stringify(metadata), now, runId)
      .run();
  }
}

async function recordAgentStep(
  env: KernelEnv,
  runId: string,
  agentIndex: number,
  agentId: KernelAgentId,
  input: Record<string, unknown>,
  output: Record<string, unknown>,
  status: "completed" | "failed",
  failure?: { classification: string; message: string },
): Promise<void> {
  const inputJson = JSON.stringify(input);
  const inputHash = await hashText(inputJson);
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO step_records (
      run_id, step_name, step_index, input_json, input_hash, output_json,
      status, idempotency_key, timestamp, failure_classification, error_message, sequence
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      runId,
      stepNameForAgent(agentId),
      agentIndex,
      inputJson,
      inputHash,
      JSON.stringify(output),
      status,
      `${runId}:kernel:${agentId}`,
      now,
      failure?.classification ?? null,
      failure?.message ?? null,
      agentIndex,
    )
    .run();
}

async function callAgentLlm(
  env: KernelEnv,
  tenantId: string,
  runId: string,
  agentId: KernelAgentId,
  systemPrompt: string,
  userContent: string,
): Promise<{ text: string; provider: string; model: string }> {
  await assertRunBudget(env, tenantId, runId);
  const llm = await runKernelLlm(env, systemPrompt, userContent);
  await recordLlmUsage(
    env,
    tenantId,
    runId,
    agentId,
    llm.provider,
    llm.model,
    `${systemPrompt}\n${userContent}`,
    llm.text,
  );
  return llm;
}

export async function executeKernelPipeline(
  env: KernelEnv,
  runId: string,
  goal: string,
  tenantId: string,
  actor: string,
  options?: {
    startAgentIndex?: number;
    ingressEventId?: string;
    ingressSource?: IngressSource;
    ingressPayload?: Record<string, unknown>;
  },
): Promise<KernelRunResult> {
  const run = await getRun(env.DB, runId);
  if (!run) throw new Error(`Run not found: ${runId}`);

  const metadata = parseMetadata(run.metadata_json) as Record<string, unknown>;
  const startIndex = options?.startAgentIndex ?? (metadata.kernel_next_agent as number) ?? 0;

  let ingressEventId = options?.ingressEventId ?? (metadata.ingress_event_id as string | undefined);
  if (!ingressEventId && options?.ingressSource) {
    ingressEventId = await recordIngressEvent(
      env,
      tenantId,
      options.ingressSource,
      options.ingressPayload ?? { goal },
    );
    metadata.ingress_event_id = ingressEventId;
    await updateRunMetadata(env.DB, runId, metadata);
  }

  const ctx: PipelineContext = {
    goal,
    context: [`User goal: ${goal}`],
    plannedSteps: (metadata.planned_steps as PipelineContext["plannedSteps"]) ?? [],
    metadata,
  };

  const agentResults: KernelAgentResult[] = [];

  for (let index = startIndex; index < KERNEL_AGENTS.length; index++) {
    const agent = KERNEL_AGENTS[index];
    const userContent =
      ctx.context.length === 1
        ? ctx.context[0]
        : `Prior agent outputs:\n${ctx.context.slice(1).join("\n\n")}\n\nContinue for goal: ${ctx.goal}`;

    try {
      const result = await runAgent(env, runId, tenantId, actor, index, agent.id, ctx, userContent);
      agentResults.push(result);

      if (result.output) ctx.context.push(`${agent.name}: ${result.output}`);

      metadata.kernel_next_agent = index + 1;
      await updateRunMetadata(env.DB, runId, metadata);

      const steps = await getSteps(env.DB, runId);
      const updatedRun = (await getRun(env.DB, runId))!;
      const blockers = getResumeBlockers(updatedRun, steps);

      if (agent.id === "gatekeeper" && blockers.length > 0) {
        metadata.kernel_halt_reason = "gates";
        metadata.kernel_next_agent = index + 1;
        await updateRunMetadata(env.DB, runId, metadata, "failed");
        await recordAuditEvent(env.DB, runId, "kernel.gated", actor, { blockers });
        if (ingressEventId) await markIngressProcessed(env, ingressEventId, runId, "failed");
        return buildResult(runId, "failed", agentResults, true, blockers, env, ingressEventId);
      }
    } catch (err) {
      if (err instanceof LlmBudgetExceededError) {
        metadata.kernel_halt_reason = "budget";
        metadata.kernel_next_agent = index;
        await updateRunMetadata(env.DB, runId, metadata, "failed");
        await recordAuditEvent(env.DB, runId, "kernel.budget_exceeded", actor, {
          error: err.message,
        });
        if (ingressEventId) await markIngressProcessed(env, ingressEventId, runId, "failed");
        throw err;
      }
      throw err;
    }
  }

  await updateRunMetadata(env.DB, runId, metadata, "completed");
  await recordAuditEvent(env.DB, runId, "kernel.completed", actor, {
    agent_count: KERNEL_AGENTS.length,
    tenant_id: tenantId,
  });
  if (ingressEventId) await markIngressProcessed(env, ingressEventId, runId, "completed");

  return buildResult(runId, "completed", agentResults, false, [], env, ingressEventId);
}

async function runAgent(
  env: KernelEnv,
  runId: string,
  tenantId: string,
  actor: string,
  index: number,
  agentId: KernelAgentId,
  ctx: PipelineContext,
  userContent: string,
): Promise<KernelAgentResult> {
  const agent = KERNEL_AGENTS[index];

  switch (agentId) {
    case "ingress": {
      const llm = await callAgentLlm(env, tenantId, runId, agentId, agent.systemPrompt, userContent);
      const parsed = parseJsonFromLlm<Record<string, unknown>>(llm.text);
      const normalized = parsed ?? { intent: ctx.goal, raw: llm.text };
      ctx.metadata.ingress_normalized = normalized;
      await recordAgentStep(env, runId, index, agentId, { goal: ctx.goal }, { normalized, llm: llm.text }, "completed");
      await recordAuditEvent(env.DB, runId, `kernel.${agentId}`, actor, { normalized });
      return { id: agentId, name: agent.name, step_index: index, output: llm.text, model: llm.model, provider: llm.provider };
    }

    case "planner": {
      const llm = await callAgentLlm(env, tenantId, runId, agentId, agent.systemPrompt, userContent);
      const parsed = parseJsonFromLlm<{ steps?: PipelineContext["plannedSteps"] }>(llm.text);
      ctx.plannedSteps = parsed?.steps ?? [{ name: "execute_goal", description: ctx.goal, depends_on: "" }];
      ctx.metadata.planned_steps = ctx.plannedSteps;
      await recordAgentStep(env, runId, index, agentId, { goal: ctx.goal }, { planned_steps: ctx.plannedSteps }, "completed");
      return { id: agentId, name: agent.name, step_index: index, output: llm.text, model: llm.model, provider: llm.provider };
    }

    case "orchestrator": {
      const llm = await callAgentLlm(env, tenantId, runId, agentId, agent.systemPrompt, userContent);
      const parsed = parseJsonFromLlm<Record<string, unknown>>(llm.text);
      ctx.metadata.orchestration = parsed ?? { phases: ctx.plannedSteps.map((s) => s.name) };
      await recordAgentStep(env, runId, index, agentId, { planned_steps: ctx.plannedSteps }, { orchestration: ctx.metadata.orchestration }, "completed");
      return { id: agentId, name: agent.name, step_index: index, output: llm.text, model: llm.model, provider: llm.provider };
    }

    case "executor": {
      const toolList = KERNEL_TOOLS.join(", ");
      const execPrompt = `${agent.systemPrompt}\nAvailable tools: ${toolList}. Reply JSON: {"tool":"<tool_name>","args":{...}}`;
      const llm = await callAgentLlm(env, tenantId, runId, agentId, execPrompt, userContent);
      const parsed = parseJsonFromLlm<{ tool?: string; args?: Record<string, unknown> }>(llm.text);
      const toolName = parsed?.tool ?? "health_probe";
      const toolArgs = parsed?.args ?? { message: ctx.goal };
      const toolResult = await invokeKernelTool(env, runId, index, toolName, toolArgs);

      if (!toolResult.ok) {
        await recordAgentStep(
          env,
          runId,
          index,
          agentId,
          { tool: toolName, args: toolArgs },
          { tool_result: toolResult.output, llm: llm.text },
          "failed",
          {
            classification: toolResult.classification ?? "partial",
            message: toolResult.error ?? "Tool execution failed",
          },
        );
        await updateRunMetadata(env.DB, runId, ctx.metadata, "failed");
      } else {
        await recordAgentStep(
          env,
          runId,
          index,
          agentId,
          { tool: toolName, args: toolArgs },
          { tool_result: toolResult.output, llm: llm.text },
          "completed",
        );
      }

      return {
        id: agentId,
        name: agent.name,
        step_index: index,
        output: JSON.stringify({ tool: toolName, result: toolResult }),
        model: llm.model,
        provider: llm.provider,
        tool_invoked: toolName,
      };
    }

    case "classifier": {
      const steps = await getSteps(env.DB, runId);
      const failed = steps.find((s) => s.status === "failed");
      if (failed && failed.failure_classification) {
        const outputObj = {
          primary_classification: failed.failure_classification,
          step_name: failed.step_name,
          from: "executor_failure",
        };
        const output = JSON.stringify(outputObj);
        await recordAgentStep(env, runId, index, agentId, {}, outputObj, "completed");
        return { id: agentId, name: agent.name, step_index: index, output, model: KERNEL_MODEL };
      }
      const llm = await callAgentLlm(env, tenantId, runId, agentId, agent.systemPrompt, userContent);
      const parsed = parseJsonFromLlm<{ primary_classification?: string }>(llm.text);
      if (parsed?.primary_classification && parsed.primary_classification !== "none") {
        const lastExec = steps.filter((s) => s.step_name === "kernel:executor").pop();
        if (lastExec && lastExec.status === "completed") {
          await env.DB.prepare(
            `UPDATE step_records SET status = 'failed', failure_classification = ?, error_message = ?
             WHERE run_id = ? AND step_name = 'kernel:executor' AND sequence = ?`,
          )
            .bind(parsed.primary_classification, "Reclassified by classifier agent", runId, lastExec.sequence)
            .run();
          await updateRunMetadata(env.DB, runId, ctx.metadata, "failed");
        }
      }
      await recordAgentStep(env, runId, index, agentId, {}, { classification: parsed ?? llm.text }, "completed");
      return { id: agentId, name: agent.name, step_index: index, output: llm.text, model: llm.model, provider: llm.provider };
    }

    case "gatekeeper":
    case "observer":
    case "auditor":
    case "optimizer": {
      const llm = await callAgentLlm(env, tenantId, runId, agentId, agent.systemPrompt, userContent);
      const extra: Record<string, unknown> = {};
      if (agentId === "observer") {
        const run = await getRun(env.DB, runId);
        const steps = await getSteps(env.DB, runId);
        extra.live_status = run?.status;
        extra.blockers = run ? getResumeBlockers(run, steps) : [];
      }
      if (agentId === "optimizer") {
        const usage = await getUsageSummary(env, runId);
        const budget = await getRunBudgetUsd(env, tenantId);
        const spent = await getRunSpentUsd(env, runId);
        extra.usage = usage;
        extra.budget_usd = budget;
        extra.spent_usd = spent;
        extra.circuit_breaker_armed = spent >= budget * 0.9;
        ctx.metadata.optimizer = extra;
      }
      await recordAgentStep(env, runId, index, agentId, {}, { llm: llm.text, ...extra }, "completed");
      await recordAuditEvent(env.DB, runId, `kernel.${agentId}`, actor, extra);
      return { id: agentId, name: agent.name, step_index: index, output: llm.text, model: llm.model, provider: llm.provider };
    }

    default:
      throw new Error(`Unknown agent: ${agentId}`);
  }
}

async function buildResult(
  runId: string,
  status: string,
  agents: KernelAgentResult[],
  gated: boolean,
  blockers: ReturnType<typeof getResumeBlockers>,
  env: KernelEnv,
  ingressEventId?: string,
): Promise<KernelRunResult> {
  const usage = await getUsageSummary(env, runId);
  return {
    run_id: runId,
    workflow_name: "kernel_nine_agent",
    status,
    model: agents[0]?.model ?? KERNEL_MODEL,
    agents,
    gated,
    blockers: gated ? blockers : undefined,
    usage,
    ingress_event_id: ingressEventId,
  };
}

export function kernelAgentCatalog(llmAvailable: boolean) {
  return {
    model: KERNEL_MODEL,
    ai_available: llmAvailable,
    agents: KERNEL_AGENTS.map((a) => ({
      id: a.id,
      name: a.name,
      role: a.role,
      status: "live" as const,
      runtime: "kernel-v2",
      step_name: stepNameForAgent(a.id),
      capabilities:
        a.id === "ingress"
          ? ["webhook", "queue", "human"]
          : a.id === "executor"
            ? KERNEL_TOOLS
            : a.id === "optimizer"
              ? ["cost_breaker", "usage_metrics"]
              : a.id === "gatekeeper"
                ? ["enforce_gates"]
                : ["llm"],
    })),
  };
}

export async function resumeKernelPipeline(
  env: KernelEnv,
  runId: string,
  tenantId: string,
  actor: string,
): Promise<KernelRunResult> {
  const run = await getRun(env.DB, runId);
  if (!run) throw new Error(`Run not found: ${runId}`);

  const steps = await getSteps(env.DB, runId);
  const blockers = getResumeBlockers(run, steps);
  if (blockers.length > 0) {
    throw new Error(`Cannot resume: ${blockers.length} gate blocker(s) remain`);
  }

  const metadata = parseMetadata(run.metadata_json) as Record<string, unknown>;
  const goal = String(metadata.goal ?? "");
  const nextIndex = (metadata.kernel_next_agent as number) ?? 0;

  await updateRunMetadata(env.DB, runId, metadata, "running");
  return executeKernelPipeline(env, runId, goal, tenantId, actor, { startAgentIndex: nextIndex });
}

export async function drainIngressQueue(
  env: KernelEnv,
  limit = 5,
): Promise<{ processed: number; run_ids: string[] }> {
  const { results } = await env.DB.prepare(
    `SELECT * FROM ingress_events WHERE status = 'pending' AND source = 'queue'
     ORDER BY created_at ASC LIMIT ?`,
  )
    .bind(limit)
    .all<{ id: string; tenant_id: string; payload_json: string }>();

  const processed: string[] = [];
  for (const row of results ?? []) {
    await env.DB.prepare(`UPDATE ingress_events SET status = 'processing' WHERE id = ?`)
      .bind(row.id)
      .run();

    const payload = JSON.parse(row.payload_json) as Record<string, unknown>;
    const goal = extractGoalFromPayload(payload);
    const runId = crypto.randomUUID();
    const now = new Date().toISOString();
    await env.DB.prepare(
      `INSERT INTO runs (run_id, workflow_name, status, environment, tenant_id, created_at, updated_at, metadata_json)
       VALUES (?, 'kernel_nine_agent', 'running', 'dev', ?, ?, ?, ?)`,
    )
      .bind(runId, row.tenant_id, now, now, JSON.stringify({ goal, kernel: true, kernel_next_agent: 0 }))
      .run();
    try {
      await executeKernelPipeline(env, runId, goal, row.tenant_id, "ingress:queue", {
        ingressEventId: row.id,
        ingressSource: "queue",
        ingressPayload: payload,
      });
      processed.push(runId);
    } catch {
      await markIngressProcessed(env, row.id, runId, "failed");
    }
  }
  return { processed: processed.length, run_ids: processed };
}

export { extractGoalFromPayload, recordIngressEvent };
