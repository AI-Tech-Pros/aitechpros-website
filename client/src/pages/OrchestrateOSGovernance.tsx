/*
 * Governance objection-handling — why observability is not governance.
 */
import OrchestrateOSSubpage, { SubSection } from "@/components/OrchestrateOSSubpage";
import OrchestrateOSNineAgentKernel from "@/components/OrchestrateOSNineAgentKernel";
import OrchestrateOSLifecycleLoop from "@/components/OrchestrateOSLifecycleLoop";
import { Link } from "wouter";

const objections = [
  {
    claim: "We already use LangSmith for tracing.",
    response:
      "LangSmith excels at post-hoc observability — what ran, what failed, token costs. It does not block resume paths when a partial failure needs compensation or when production requires operator acknowledgment. OrchestrateOS gates execution before side effects repeat.",
  },
  {
    claim: "CrewAI restarts are fine for our prototypes.",
    response:
      "Prototypes become production without warning. CrewAI restarts from step one on failure, re-firing LLM calls and side effects. OrchestrateOS checkpoints every step and resumes from the last success — the difference is 46 wasted steps in a 50-step claims pipeline.",
  },
  {
    claim: "Microsoft Agent Framework gives us enterprise governance.",
    response:
      "Inside Azure, yes — with lock-in. OrchestrateOS delivers approval gates, audit export, and environment-scoped resume rules on your framework of choice (LangGraph, CrewAI, plain Python) with a portable control plane API.",
  },
  {
    claim: "We can build checkpointing ourselves.",
    response:
      "You can — and most teams underestimate idempotency collisions, compensation semantics, and audit reproducibility. resume_engine is the extraction layer: durable steps, classified failures, and governed resume in one pip install.",
  },
];

export default function OrchestrateOSGovernance() {
  return (
    <OrchestrateOSSubpage
      eyebrow="Governance guide"
      title={
        <>
          Why observability <span className="gradient-text">is not</span> governance
        </>
      }
      subtitle="Objection-handling for teams evaluating LangGraph, CrewAI, or Azure agents who need governed resume — not just traces after deploy."
    >
      <SubSection title="The wedge">
        <p>
          LangSmith answers <strong className="text-white/80">what happened</strong>. OrchestrateOS
          answers <strong className="text-white/80">what may run next</strong> — and under whose
          authority. Deployment governance means gates before resume: compensation for partial
          failures, operator approval for permanent failures, and extra acknowledgment for production
          environments.
        </p>
        <p>
          Try the live demo on the{" "}
          <Link href="/#gates" className="text-[#06B6D4] hover:underline">
            gate explorer
          </Link>{" "}
          — seeded runs on the real Worker API demonstrate transient, partial, and permanent
          failure paths.
        </p>
      </SubSection>

      <SubSection title="Perceive → Plan → Act → Observe → Learn">
        <p className="mb-6 text-white/55 text-sm">
          The lifecycle loop on our{" "}
          <Link href="/#lifecycle" className="text-[#06B6D4] hover:underline">
            landing page
          </Link>{" "}
          maps marketing language to concrete API primitives — not a separate agent runtime.
        </p>
        <OrchestrateOSLifecycleLoop />
      </SubSection>

      <SubSection title="Nine-agent kernel (reference architecture)">
        <OrchestrateOSNineAgentKernel />
      </SubSection>

      <SubSection title="Shipped in kernel v2">
        <ul className="list-disc pl-5 space-y-2 text-white/55 text-sm">
          <li>
            <strong className="text-white/70">Cost circuit breaker</strong> — per-run LLM budget with{" "}
            <code className="text-[#06B6D4] text-xs">llm_usage</code> tracking and halt on exceed
          </li>
          <li>
            <strong className="text-white/70">Consensus gate</strong> — multi-reviewer approval on permanent
            failures when{" "}
            <code className="text-[#06B6D4] text-xs">consensus_min_approvers</code> is set at{" "}
            <code className="text-[#06B6D4] text-xs">start_run</code>; votes via{" "}
            <code className="text-[#06B6D4] text-xs">POST /runs/:id/consensus_vote</code>
          </li>
          <li>
            <strong className="text-white/70">Optimizer metrics</strong> — usage, budget, and circuit-breaker
            state on every kernel run; advisory retry notes via{" "}
            <code className="text-[#06B6D4] text-xs">GET /runs/:id/retry_policy</code>
          </li>
          <li>
            <strong className="text-white/70">Executor tools</strong> — real tool bindings (HTTP, health
            probe, JSON validate, Slack notify, and more)
          </li>
        </ul>
      </SubSection>

      <SubSection title="Roadmap — not shipped yet">
        <ul className="list-disc pl-5 space-y-2 text-white/55 text-sm">
          <li>
            <strong className="text-white/70">Automated retry policy tuning</strong> — apply optimizer
            recommendations to workflow retry config automatically (metrics and advisory endpoint live today)
          </li>
        </ul>
      </SubSection>

      {objections.map((item) => (
        <SubSection key={item.claim} title={item.claim}>
          <p>{item.response}</p>
        </SubSection>
      ))}

      <SubSection title="When to choose OrchestrateOS">
        <ul className="list-disc pl-5 space-y-2">
          <li>Multi-step agent workflows with costly LLM or side-effecting steps</li>
          <li>Healthcare, finance, or ops teams that need audit export and human gates</li>
          <li>Teams outgrowing CrewAI restart semantics but not ready for Azure lock-in</li>
          <li>Design partners who want governed resume without building orchestration in-house</li>
        </ul>
      </SubSection>
    </OrchestrateOSSubpage>
  );
}
