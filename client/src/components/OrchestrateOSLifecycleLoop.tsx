/**
 * Perceive → Plan → Act → Observe → Learn — mapped honestly to resume_engine + gates.
 */

const phases = [
  {
    phase: "Perceive",
    color: "#8B5CF6",
    summary: "Capture intent and inputs before side effects run.",
    live: [
      "POST /start_run — workflow name, environment, metadata",
      "Step inputs persisted on every record_step call",
      "Partner tenant_id scopes runs in D1",
    ],
  },
  {
    phase: "Plan",
    color: "#06B6D4",
    summary: "Define the step graph — in your framework, not a fake canvas.",
    live: [
      "LangGraph / CrewAI / plain Python owns the DAG",
      "OrchestrateOS stores step_index + sequence ordering",
      "Resume picks up at last completed step automatically",
    ],
  },
  {
    phase: "Act",
    color: "#3B82F6",
    summary: "Execute with durable checkpoints and idempotent side effects.",
    live: [
      "@durable_step / adapters record completion or failure",
      "Idempotency keys prevent double API calls on resume",
      "RemoteCheckpointStore syncs to the Worker control plane",
    ],
  },
  {
    phase: "Observe",
    color: "#10B981",
    summary: "See status, blockers, and gate state — not just post-hoc traces.",
    live: [
      "GET /runs/{id}/status and /resume_blockers",
      "Live gate explorer on orchestrateos.pages.dev/#gates",
      "Partner dashboard + admin outcomes for real run_id rows",
    ],
  },
  {
    phase: "Learn",
    color: "#F59E0B",
    summary: "Replay and audit for compliance; improve from classified failures.",
    live: [
      "GET /runs/{id}/audit_events — immutable governance log",
      "GET /runs/{id}/replay — deterministic replay payload",
      "Failure classification drives retry vs compensate vs approve",
    ],
  },
] as const;

export default function OrchestrateOSLifecycleLoop() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-0">
        {phases.map((item, i) => (
          <div key={item.phase} className="flex items-center">
            <div
              className="px-4 py-2 rounded-xl border text-sm font-semibold font-[Montserrat] whitespace-nowrap"
              style={{
                borderColor: `${item.color}40`,
                backgroundColor: `${item.color}12`,
                color: item.color,
              }}
            >
              {item.phase}
            </div>
            {i < phases.length - 1 && (
              <span className="hidden sm:inline text-white/20 mx-2 text-lg" aria-hidden>
                →
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {phases.map((item) => (
          <div
            key={item.phase}
            className="glass-card rounded-2xl p-5 border border-white/[0.06]"
          >
            <p
              className="text-xs uppercase tracking-wider font-[Montserrat] font-semibold mb-2"
              style={{ color: item.color }}
            >
              {item.phase}
            </p>
            <p className="text-white/70 text-sm mb-3 leading-relaxed">{item.summary}</p>
            <ul className="space-y-1.5">
              {item.live.map((line) => (
                <li key={line} className="text-white/45 text-xs leading-relaxed flex gap-2">
                  <span className="text-[#06B6D4] shrink-0">●</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="text-center text-white/35 text-xs max-w-2xl mx-auto">
        This loop is how we talk about agent lifecycles. The shipped product is governed{" "}
        <strong className="text-white/50">checkpoint + gates</strong> — not nine autonomous
        agents running in the Worker.
      </p>
    </div>
  );
}
