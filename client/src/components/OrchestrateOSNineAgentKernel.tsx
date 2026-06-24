/**
 * Nine-agent kernel v2 — ingress, real tools, enforced gates, cost breaker.
 */

import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  fetchKernelAgents,
  fetchKernelObserver,
  fetchLlmStatus,
  resumeKernelRun,
  runKernelAgents,
  type KernelAgentInfo,
  type KernelObserverResponse,
  type KernelRunResponse,
  type LlmStatusResponse,
  type ResumeBlocker,
} from "@/lib/orchestrateos-api";

const statusStyle = "bg-emerald-500/15 text-emerald-400 border-emerald-500/25";
const gatedStyle = "bg-amber-500/15 text-amber-400 border-amber-500/25";

function capabilityLabel(caps?: string[]): string {
  if (!caps?.length) return "LLM";
  return caps.join(" · ");
}

function BlockerList({ blockers }: { blockers: ResumeBlocker[] }) {
  if (!blockers.length) return null;
  return (
    <ul className="space-y-2 text-xs text-amber-200/90">
      {blockers.map((b) => (
        <li key={b.failure_key} className="border border-amber-500/20 rounded-lg px-3 py-2 bg-amber-500/5">
          <span className="font-mono text-amber-300">{b.classification}</span> — {b.step_name}: {b.message}
          <span className="block text-white/45 mt-1">Required: {b.required_action}</span>
        </li>
      ))}
    </ul>
  );
}

export default function OrchestrateOSNineAgentKernel() {
  const [agents, setAgents] = useState<KernelAgentInfo[]>([]);
  const [model, setModel] = useState("");
  const [llmStatus, setLlmStatus] = useState<LlmStatusResponse | null>(null);
  const [goal, setGoal] = useState("Summarize a partner onboarding workflow with governance gates.");
  const [loading, setLoading] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<KernelRunResponse | null>(null);
  const [observer, setObserver] = useState<KernelObserverResponse | null>(null);

  useEffect(() => {
    Promise.all([fetchKernelAgents(), fetchLlmStatus()])
      .then(([agentsData, statusData]) => {
        setAgents(agentsData.agents);
        setModel(agentsData.model);
        setLlmStatus(statusData);
      })
      .catch(() => setError("Could not load kernel agents from the Worker API."));
  }, []);

  async function refreshObserver(runId: string) {
    try {
      const obs = await fetchKernelObserver(runId);
      setObserver(obs);
    } catch {
      /* observer optional */
    }
  }

  async function handleRun() {
    setLoading(true);
    setError(null);
    setObserver(null);
    try {
      const result = await runKernelAgents(goal);
      setLastRun(result);
      await refreshObserver(result.run_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kernel run failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleResume() {
    if (!lastRun) return;
    setResuming(true);
    setError(null);
    try {
      const result = await resumeKernelRun(lastRun.run_id);
      setLastRun(result);
      await refreshObserver(result.run_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Resume failed");
    } finally {
      setResuming(false);
    }
  }

  const gated = lastRun?.gated || (observer && !observer.can_resume && observer.blockers.length > 0);
  const usage = lastRun?.usage ?? observer?.usage;

  return (
    <div className="space-y-6">
      <p className="text-white/55 text-sm leading-relaxed">
        Kernel <strong className="text-white/75">v2</strong> runs all nine agents with real ingress, tool
        execution (<code className="text-[#06B6D4] text-xs">echo</code>,{" "}
        <code className="text-[#06B6D4] text-xs">http_get</code>,{" "}
        <code className="text-[#06B6D4] text-xs">health_probe</code>,{" "}
        <code className="text-[#06B6D4] text-xs">json_validate</code>,{" "}
        <code className="text-[#06B6D4] text-xs">hash_sha256</code>,{" "}
        <code className="text-[#06B6D4] text-xs">fetch_run_status</code>,{" "}
        <code className="text-[#06B6D4] text-xs">slack_notify</code>,{" "}
        <code className="text-[#06B6D4] text-xs">delay_ms</code>), enforced resume gates, and a per-run
        LLM cost breaker ({model || "@cf/meta/llama-3.1-8b-instruct"}).
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
                className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-md border shrink-0 ${
                  agent.runtime === "kernel-v2" ? statusStyle : statusStyle
                }`}
              >
                {agent.runtime}
              </span>
            </div>
            <p className="text-white/45 text-xs mb-3">{agent.role}</p>
            <p className="text-white/35 text-[10px] font-mono mb-2">{capabilityLabel(agent.capabilities)}</p>
            <p className="text-white/60 text-xs leading-relaxed mt-auto font-mono">{agent.step_name}</p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-6 border border-[#8B5CF6]/20 space-y-4">
        <p className="text-sm text-white/70">
          <strong className="text-white">Run the kernel:</strong> ingress → planner → orchestrator → executor
          (real tools) → classifier → gatekeeper (enforces gates) → observer → auditor → optimizer (usage +
          budget). Partner ingress: <code className="text-[#06B6D4] text-xs">POST /ingress/webhook</code> with{" "}
          <code className="text-[#06B6D4] text-xs">X-Ingress-Secret</code>.
        </p>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          rows={3}
          className="w-full rounded-xl bg-black/30 border border-white/10 text-white/80 text-sm p-3 font-mono resize-y"
        />
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleRun}
            disabled={loading || !goal.trim()}
            className="px-4 py-2 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 text-white text-sm font-medium"
          >
            {loading ? "Running nine agents…" : "Run nine-agent kernel"}
          </button>
          {lastRun && gated && (
            <button
              type="button"
              onClick={handleResume}
              disabled={resuming || (observer !== null && !observer.can_resume)}
              className="px-4 py-2 rounded-lg border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 disabled:opacity-50 text-sm font-medium"
            >
              {resuming ? "Resuming…" : "Resume after gates cleared"}
            </button>
          )}
        </div>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        {lastRun && (
          <div className="text-xs text-white/60 space-y-3 border-t border-white/10 pt-4">
            <p className="flex flex-wrap items-center gap-2">
              Run <code className="text-[#06B6D4]">{lastRun.run_id}</code>
              <span
                className={`px-2 py-0.5 rounded border text-[10px] uppercase ${
                  lastRun.gated ? gatedStyle : statusStyle
                }`}
              >
                {lastRun.status}
                {lastRun.gated ? " · gated" : ""}
              </span>
              <Link href={`/admin/outcomes`} className="text-[#06B6D4] hover:underline">
                outcomes
              </Link>
            </p>
            {usage && (
              <p className="font-mono text-white/45">
                Optimizer: {usage.call_count} LLM calls · ~${usage.estimated_cost_usd.toFixed(4)} USD ·{" "}
                {usage.prompt_tokens + usage.completion_tokens} tokens
              </p>
            )}
            <BlockerList blockers={lastRun.blockers ?? observer?.blockers ?? []} />
            <ul className="space-y-1 max-h-48 overflow-y-auto font-mono">
              {lastRun.agents.map((a) => (
                <li key={a.id}>
                  <span className="text-white/40">{a.name}:</span> {a.output.slice(0, 120)}
                  {a.tool_invoked ? (
                    <span className="text-[#06B6D4]"> [{a.tool_invoked}]</span>
                  ) : null}
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
