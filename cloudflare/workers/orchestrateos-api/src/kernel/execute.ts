import { recordAuditEvent } from "../audit";
import type { LlmEnv } from "../llm/env";
import { KERNEL_AGENTS, KERNEL_MODEL, stepNameForAgent, type KernelAgentId } from "./agents";
import { runKernelLlm } from "./llm";

export type KernelEnv = LlmEnv & {
  DB: D1Database;
};

export type KernelAgentResult = {
  id: KernelAgentId;
  name: string;
  step_index: number;
  output: string;
  model: string;
};

export type KernelRunResult = {
  run_id: string;
  workflow_name: string;
  status: string;
  model: string;
  agents: KernelAgentResult[];
};

async function hashText(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function executeKernelPipeline(
  env: KernelEnv,
  runId: string,
  goal: string,
  tenantId: string,
  actor: string,
): Promise<KernelRunResult> {
  const context: string[] = [`User goal: ${goal}`];
  const agentResults: KernelAgentResult[] = [];

  for (let index = 0; index < KERNEL_AGENTS.length; index++) {
    const agent = KERNEL_AGENTS[index];
    const userContent =
      context.length === 1
        ? context[0]
        : `Prior agent outputs:\n${context.slice(1).join("\n\n")}\n\nContinue for goal: ${goal}`;

    const llm = await runKernelLlm(env, agent.systemPrompt, userContent);
    const output = llm.text;
    context.push(`${agent.name}: ${output}`);

    const inputJson = JSON.stringify({ goal, prior_context_count: context.length - 2 });
    const inputHash = await hashText(inputJson);
    const now = new Date().toISOString();
    const stepName = stepNameForAgent(agent.id);
    const idempotencyKey = `${runId}:kernel:${agent.id}`;

    await env.DB.prepare(
      `INSERT INTO step_records (
        run_id, step_name, step_index, input_json, input_hash, output_json,
        status, idempotency_key, timestamp, failure_classification, error_message, sequence
      ) VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, ?, NULL, NULL, ?)`,
    )
      .bind(
        runId,
        stepName,
        index,
        inputJson,
        inputHash,
        JSON.stringify({ agent: agent.id, model: llm.model, provider: llm.provider, response: output }),
        idempotencyKey,
        now,
        index,
      )
      .run();

    await recordAuditEvent(env.DB, runId, `kernel.${agent.id}`, actor, {
      model: llm.model,
      provider: llm.provider,
      step_index: index,
    });

    agentResults.push({
      id: agent.id,
      name: agent.name,
      step_index: index,
      output,
      model: llm.model,
    });
  }

  const completedAt = new Date().toISOString();
  await env.DB.prepare("UPDATE runs SET status = ?, updated_at = ? WHERE run_id = ?")
    .bind("completed", completedAt, runId)
    .run();

  await recordAuditEvent(env.DB, runId, "kernel.completed", actor, {
    agent_count: KERNEL_AGENTS.length,
    tenant_id: tenantId,
  });

  return {
    run_id: runId,
    workflow_name: "kernel_nine_agent",
    status: "completed",
    model: agentResults[0]?.model ?? KERNEL_MODEL,
    agents: agentResults,
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
      runtime: "llm-router",
      step_name: stepNameForAgent(a.id),
    })),
  };
}
