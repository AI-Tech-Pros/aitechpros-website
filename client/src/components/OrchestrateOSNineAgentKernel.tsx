/**
 * Nine-agent kernel — each agent runs a Workers AI LLM call on the control plane.
 */

import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  fetchKernelAgents,
  fetchLlmStatus,
  runKernelAgents,
  type KernelAgentInfo,
  type KernelRunResponse,
  type LlmStatusResponse,
} from "@/lib/orchestrateos-api";

const statusStyle = "bg-emerald-500/15 text-emerald-400 border-emerald-500/25";

export default function OrchestrateOSNineAgentKernel() {
  const [agents, setAgents] = useState<KernelAgentInfo[]>([]);
  const [model, setModel] = useState("");
  const [llmStatus, setLlmStatus] = useState<LlmStatusResponse | null>(null);
  const [goal, setGoal] = useState("Summarize a partner onboarding workflow with governance gates.");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<KernelRunResponse | null>(null);

  useEffect(() => {
    Promise.all([fetchKernelAgents(), fetchLlmStatus()])
      .then(([agentsData, statusData]) => {
        setAgents(agentsData.agents);
        setModel(agentsData.model);
        setLlmStatus(statusData);
      })
      .catch(() => setError("Could not load kernel agents from the Worker API."));
  }, []);

  async function handleRun() {
    setLoading(true);
    setError(null);
    try {
      const result = await runKernelAgents(goal);
      setLastRun(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kernel run failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-white/55 text-sm leading-relaxed">
        All nine agents run as <strong className="text-white/75">LLM calls</strong> via the control
        plane router ({model || "@cf/meta/llama-3.1-8b-instruct"} default). Each agent writes a
        checkpointed step to D1 — orchestration, gates, and audit stay on the same Worker.
      </p>

      {llmStatus && (
        <p className="text-white/45 text-xs font-mono">
          Primary provider: {llmStatus.primary_provider ?? "none"} · chain:{" "}
          {llmStatus.provider_chain.join(" → ")}
          {llmStatus.ai_gateway ? " · AI Gateway" : ""}
        </p>
      )}

      {llmStatus && !llmStatus.primary_provider && (
        <p className="text-amber-400/90 text-xs border border-amber-500/25 rounded-lg px-3 py-2 bg-amber-500/10">
          No LLM providers configured. Add Workers AI binding and/or set{" "}
          <code className="text-amber-200/80">OPENAI_API_KEY</code> /{" "}
          <code className="text-amber-200/80">ANTHROPIC_API_KEY</code> secrets on the Worker.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 flex flex-col"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-white font-semibold font-[Montserrat]">{agent.name}</h3>
              <span
                className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-md border shrink-0 ${statusStyle}`}
              >
                LLM live
              </span>
            </div>
            <p className="text-white/45 text-xs mb-3">{agent.role}</p>
            <p className="text-white/60 text-xs leading-relaxed mt-auto font-mono">{agent.step_name}</p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-6 border border-[#8B5CF6]/20 space-y-4">
        <p className="text-sm text-white/70">
          <strong className="text-white">Run the kernel:</strong> executes all nine agents in sequence on
          your goal. Requires a runner API key in{" "}
          <code className="text-[#06B6D4] text-xs">VITE_ORCHESTRATEOS_DEMO_KEY</code> (operator) or runner key.
        </p>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          rows={3}
          className="w-full rounded-xl bg-black/30 border border-white/10 text-white/80 text-sm p-3 font-mono resize-y"
        />
        <button
          type="button"
          onClick={handleRun}
          disabled={loading || !goal.trim()}
          className="px-4 py-2 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 text-white text-sm font-medium"
        >
          {loading ? "Running nine agents…" : "Run nine-agent kernel"}
        </button>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        {lastRun && (
          <div className="text-xs text-white/60 space-y-2 border-t border-white/10 pt-4">
            <p>
              Run <code className="text-[#06B6D4]">{lastRun.run_id}</code> — {lastRun.status} —{" "}
              <Link href={`/admin/outcomes`} className="text-[#06B6D4] hover:underline">
                view in outcomes
              </Link>
            </p>
            <ul className="space-y-1 max-h-48 overflow-y-auto font-mono">
              {lastRun.agents.map((a) => (
                <li key={a.id}>
                  <span className="text-white/40">{a.name}:</span> {a.output.slice(0, 120)}
                  {a.output.length > 120 ? "…" : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
