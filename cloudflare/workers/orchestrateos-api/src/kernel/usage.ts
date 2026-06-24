import type { KernelEnv } from "./execute";
import type { KernelAgentId } from "./agents";

export class LlmBudgetExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmBudgetExceededError";
  }
}

const COST_PER_1K: Record<string, number> = {
  "workers-ai": 0.0001,
  openai: 0.00015,
  anthropic: 0.00025,
};

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

export function estimateLlmCost(provider: string, prompt: string, completion: string): number {
  const rate = COST_PER_1K[provider] ?? 0.0002;
  const tokens = estimateTokens(prompt) + estimateTokens(completion);
  return (tokens / 1000) * rate;
}

export async function getRunBudgetUsd(env: KernelEnv, tenantId: string): Promise<number> {
  const row = await env.DB.prepare(
    "SELECT budget_usd FROM tenant_llm_budgets WHERE tenant_id = ?",
  )
    .bind(tenantId)
    .first<{ budget_usd: number }>();

  if (row?.budget_usd != null) return row.budget_usd;

  const defaultBudget = parseFloat(env.LLM_BUDGET_USD_PER_RUN ?? "0.10");
  return Number.isFinite(defaultBudget) ? defaultBudget : 0.1;
}

export async function getRunSpentUsd(env: KernelEnv, runId: string): Promise<number> {
  const row = await env.DB.prepare(
    "SELECT COALESCE(SUM(estimated_cost_usd), 0) AS spent FROM llm_usage WHERE run_id = ?",
  )
    .bind(runId)
    .first<{ spent: number }>();
  return row?.spent ?? 0;
}

export async function assertRunBudget(
  env: KernelEnv,
  tenantId: string,
  runId: string,
): Promise<void> {
  const [budget, spent] = await Promise.all([
    getRunBudgetUsd(env, tenantId),
    getRunSpentUsd(env, runId),
  ]);
  if (spent >= budget) {
    throw new LlmBudgetExceededError(
      `LLM budget exceeded for run (${spent.toFixed(4)} / ${budget.toFixed(4)} USD)`,
    );
  }
}

export async function recordLlmUsage(
  env: KernelEnv,
  tenantId: string,
  runId: string,
  agentId: KernelAgentId,
  provider: string,
  model: string,
  prompt: string,
  completion: string,
): Promise<void> {
  const promptTokens = estimateTokens(prompt);
  const completionTokens = estimateTokens(completion);
  const cost = estimateLlmCost(provider, prompt, completion);
  const now = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO llm_usage (
      id, tenant_id, run_id, agent_id, provider, model,
      prompt_tokens, completion_tokens, estimated_cost_usd, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      crypto.randomUUID(),
      tenantId,
      runId,
      agentId,
      provider,
      model,
      promptTokens,
      completionTokens,
      cost,
      now,
    )
    .run();

  await env.DB.prepare(
    `INSERT INTO tenant_llm_budgets (tenant_id, budget_usd, spent_usd, period_start, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(tenant_id) DO UPDATE SET
       spent_usd = spent_usd + excluded.spent_usd,
       updated_at = excluded.updated_at`,
  )
    .bind(tenantId, await getRunBudgetUsd(env, tenantId), cost, now.slice(0, 10), now)
    .run();
}

export async function getUsageSummary(env: KernelEnv, runId: string) {
  const row = await env.DB.prepare(
    `SELECT
       COALESCE(SUM(prompt_tokens), 0) AS prompt_tokens,
       COALESCE(SUM(completion_tokens), 0) AS completion_tokens,
       COALESCE(SUM(estimated_cost_usd), 0) AS estimated_cost_usd,
       COUNT(*) AS call_count
     FROM llm_usage WHERE run_id = ?`,
  )
    .bind(runId)
    .first<{
      prompt_tokens: number;
      completion_tokens: number;
      estimated_cost_usd: number;
      call_count: number;
    }>();

  return (
    row ?? {
      prompt_tokens: 0,
      completion_tokens: 0,
      estimated_cost_usd: 0,
      call_count: 0,
    }
  );
}
