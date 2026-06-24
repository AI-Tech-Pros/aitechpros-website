/** Nine-agent kernel — each role is backed by a Workers AI LLM call. */

export const KERNEL_MODEL = "@cf/meta/llama-3.1-8b-instruct";

export type KernelAgentId =
  | "ingress"
  | "planner"
  | "orchestrator"
  | "executor"
  | "classifier"
  | "gatekeeper"
  | "observer"
  | "auditor"
  | "optimizer";

export type KernelAgentDef = {
  id: KernelAgentId;
  name: string;
  role: string;
  systemPrompt: string;
};

export const KERNEL_AGENTS: KernelAgentDef[] = [
  {
    id: "ingress",
    name: "Ingress",
    role: "Accept triggers (webhook, queue, human)",
    systemPrompt:
      "You are the Ingress agent. Normalize the user goal into a structured trigger: intent, constraints, urgency (low|medium|high), and required inputs. Reply in JSON with keys intent, constraints, urgency, inputs.",
  },
  {
    id: "planner",
    name: "Planner",
    role: "Workflow graph and step ordering",
    systemPrompt:
      "You are the Planner agent. Given the ingress analysis, produce an ordered step plan (3-7 steps) with dependencies. Reply in JSON with key steps: array of {name, depends_on, description}.",
  },
  {
    id: "orchestrator",
    name: "Orchestrator",
    role: "Run lifecycle and resume pointer",
    systemPrompt:
      "You are the Orchestrator agent. Map the plan to a durable run: workflow phases, checkpoint boundaries, and resume_from_index if interrupted. Reply in JSON with phases, checkpoints, resume_policy.",
  },
  {
    id: "executor",
    name: "Executor",
    role: "Step execution with checkpoints",
    systemPrompt:
      "You are the Executor agent. Simulate executing the next actionable step; describe tool calls and expected outputs. Reply in JSON with step_executed, tool_calls, output_summary.",
  },
  {
    id: "classifier",
    name: "Classifier",
    role: "Failure taxonomy",
    systemPrompt:
      "You are the Classifier agent. Assess execution risks and classify any failure modes as transient, partial, or permanent with rationale. Reply in JSON with risks[], primary_classification, rationale.",
  },
  {
    id: "gatekeeper",
    name: "Gatekeeper",
    role: "Block resume until policy satisfied",
    systemPrompt:
      "You are the Gatekeeper agent. List governance gates required before resume (compensation, human_approval, prod_resume_ack). Reply in JSON with gates[], blocked, unblock_conditions.",
  },
  {
    id: "observer",
    name: "Observer",
    role: "Status and blocker visibility",
    systemPrompt:
      "You are the Observer agent. Summarize current run status, blockers, and what an operator sees in the dashboard. Reply in JSON with status, blockers[], operator_summary.",
  },
  {
    id: "auditor",
    name: "Auditor",
    role: "Immutable trace for compliance",
    systemPrompt:
      "You are the Auditor agent. Produce an audit-oriented trace summary suitable for compliance replay. Reply in JSON with audit_events[], replay_notes, integrity_checks.",
  },
  {
    id: "optimizer",
    name: "Optimizer",
    role: "Cost circuit breaker, consensus gates",
    systemPrompt:
      "You are the Optimizer agent. Recommend cost controls, token budgets, and consensus checks for multi-agent steps. Reply in JSON with cost_estimate, circuit_breaker_rules[], consensus_recommendations.",
  },
];

export function stepNameForAgent(id: KernelAgentId): string {
  return `kernel:${id}`;
}
