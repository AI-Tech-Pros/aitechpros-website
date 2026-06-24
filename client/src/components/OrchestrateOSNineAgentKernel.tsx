/**
 * Nine-agent kernel — reference architecture only (Phase 5g).
 * Live product = resume_engine control plane + governance gates.
 */

import { Link } from "wouter";

type KernelAgent = {
  name: string;
  role: string;
  status: "live" | "partner" | "roadmap";
  mapsTo: string;
};

const agents: KernelAgent[] = [
  {
    name: "Ingress",
    role: "Accept triggers (webhook, queue, human)",
    status: "partner",
    mapsTo: "Your app calls POST /start_run or framework adapter",
  },
  {
    name: "Planner",
    role: "Workflow graph and step ordering",
    status: "partner",
    mapsTo: "LangGraph, CrewAI, or plain Python — you own the plan",
  },
  {
    name: "Orchestrator",
    role: "Run lifecycle and resume pointer",
    status: "live",
    mapsTo: "ResumeEngine.start_run / resume + Worker D1 runs table",
  },
  {
    name: "Executor",
    role: "Step execution with checkpoints",
    status: "live",
    mapsTo: "record_step, idempotency keys, RemoteCheckpointStore",
  },
  {
    name: "Classifier",
    role: "Failure taxonomy",
    status: "live",
    mapsTo: "transient / partial / permanent on step_records",
  },
  {
    name: "Gatekeeper",
    role: "Block resume until policy satisfied",
    status: "live",
    mapsTo: "compensate, approve, ack_prod_resume endpoints",
  },
  {
    name: "Observer",
    role: "Status and blocker visibility",
    status: "live",
    mapsTo: "/status, /resume_blockers, gate explorer, partner dashboard",
  },
  {
    name: "Auditor",
    role: "Immutable trace for compliance",
    status: "live",
    mapsTo: "audit_events, audit_log, /replay",
  },
  {
    name: "Optimizer",
    role: "Cost circuit breaker, consensus gates",
    status: "roadmap",
    mapsTo: "Roadmap — requires billing/metrics integration",
  },
];

const statusStyle: Record<KernelAgent["status"], string> = {
  live: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  partner: "bg-[#8B5CF6]/15 text-[#A78BFA] border-[#8B5CF6]/25",
  roadmap: "bg-white/5 text-white/40 border-white/10",
};

const statusLabel: Record<KernelAgent["status"], string> = {
  live: "Live in OrchestrateOS",
  partner: "Your stack",
  roadmap: "Roadmap",
};

export default function OrchestrateOSNineAgentKernel() {
  return (
    <div className="space-y-6">
      <p className="text-white/55 text-sm leading-relaxed">
        Enterprise agent platforms often describe a multi-agent &ldquo;kernel.&rdquo; OrchestrateOS
        ships the <strong className="text-white/75">governance control plane</strong> — checkpoints,
        gates, and audit — while your framework runs the agents. The table below is a{" "}
        <strong className="text-white/75">reference map</strong>, not a runtime with nine LLM
        agents in our Worker.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <div
            key={agent.name}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 flex flex-col"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-white font-semibold font-[Montserrat]">{agent.name}</h3>
              <span
                className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-md border shrink-0 ${statusStyle[agent.status]}`}
              >
                {statusLabel[agent.status]}
              </span>
            </div>
            <p className="text-white/45 text-xs mb-3">{agent.role}</p>
            <p className="text-white/60 text-xs leading-relaxed mt-auto font-mono">{agent.mapsTo}</p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-6 border border-[#06B6D4]/15">
        <p className="text-sm text-white/70 leading-relaxed">
          <strong className="text-white">What is live today:</strong> Orchestrator, Executor,
          Classifier, Gatekeeper, Observer, and Auditor — via{" "}
          <code className="text-[#06B6D4] text-xs">resume_engine</code> + the Cloudflare Worker
          API. Ingress and Planner stay in your codebase. Optimizer (cost/consensus) is documented
          roadmap only.
        </p>
        <p className="text-sm text-white/50 mt-3">
          See real runs in{" "}
          <Link href="/admin/outcomes" className="text-[#06B6D4] hover:underline">
            admin outcomes
          </Link>{" "}
          when step names are recorded — we link to audit/replay, not simulated agent chat.
        </p>
      </div>
    </div>
  );
}
