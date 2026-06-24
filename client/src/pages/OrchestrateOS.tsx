/*
 * OrchestrateOS product landing — https://orchestrateos.pages.dev
 * Governance-first deterministic execution (resume_engine competitive positioning)
 */
import { useEffect } from "react";
import { Link } from "wouter";
import OrchestrateOSNavbar from "@/components/OrchestrateOSNavbar";
import OrchestrateOSApiSection from "@/components/OrchestrateOSApiSection";
import OrchestrateOSComparison from "@/components/OrchestrateOSComparison";
import OrchestrateOSGatePanel from "@/components/OrchestrateOSGatePanel";
import LeadCaptureForm from "@/components/LeadCaptureForm";
import { useInView } from "@/hooks/useInView";
import {
  ArrowUpRight,
  CheckCircle2,
  GitBranch,
  Layers,
  Play,
  RefreshCw,
  Shield,
  Zap,
} from "lucide-react";
import {
  mainSiteUrl,
  orchestrateOSApiBaseUrl,
  orchestrateOSApiDocsUrl,
  siteOrigin,
} from "@/lib/site";

const CALENDLY_URL = "https://calendly.com/aitechpros/15min";
const GITHUB_URL = "https://github.com/AI-Tech-Pros";

const competitors = [
  {
    name: "LangChain / LangSmith",
    issue:
      "Strong observability after deploy — but LangSmith does not govern what ships or gate resume paths. Trace data sits on LangChain cloud unless you pay Enterprise.",
  },
  {
    name: "CrewAI",
    issue:
      "Fast multi-agent prototyping, but no built-in checkpointing on failure and execution caps that surprise production teams. Workflows restart instead of resume.",
  },
  {
    name: "Microsoft Agent Framework",
    issue:
      "AutoGen is maintenance-only; Agent Framework is pre-GA. Governance is mature inside Azure, but buyers inherit ecosystem lock-in and migration risk.",
  },
];

const primitives = [
  {
    icon: Layers,
    title: "State persistence",
    description:
      "Every step's input, output, and intermediate state is written to durable storage immediately after completion — never held only in memory.",
  },
  {
    icon: Shield,
    title: "Idempotent execution",
    description:
      "Each step carries a generated idempotency key so side effects (API calls, DB writes, emails) cannot fire twice on resume.",
  },
  {
    icon: Play,
    title: "One-call resume",
    description:
      "resume(run_id) finds the last successfully completed step and continues from there. No manual checkpoint design required.",
  },
  {
    icon: RefreshCw,
    title: "Deterministic replay",
    description:
      "Replay outputs from the audit log instead of recomputing — producing byte-for-byte identical traces for compliance.",
  },
  {
    icon: Zap,
    title: "Failure classification",
    description:
      "Every failure is tagged transient, permanent, or partial so your runtime knows whether to retry, escalate, or compensate.",
  },
];

const adapters = [
  { name: "LangGraph", detail: "Wrap any node — no graph migration" },
  { name: "CrewAI Flow", detail: "Wrap any task — no flow restructure" },
  { name: "Plain Python", detail: "@durable_step decorator for standalone pipelines" },
];

const quickstartCode = `from resume_engine import ResumeEngine, SQLiteCheckpointStore

store = SQLiteCheckpointStore("sqlite:///workflow.db")
engine = ResumeEngine(store)
run = engine.start_run("claims_pipeline")

steps = [
    ("fetch", lambda s, k: {"claim": fetch(s["id"])}),
    ("score", lambda s, k: {"risk": model(s["claim"])}),
    ("route", lambda s, k: {"queue": route(s["risk"])}),
]

try:
    engine.execute_workflow(run.run_id, steps)
except Exception:
    engine.resume(run.run_id, steps)  # picks up at last step`;

export default function OrchestrateOS() {
  const hero = useInView({ threshold: 0.05 });
  const problem = useInView({ threshold: 0.05 });
  const compare = useInView({ threshold: 0.05 });
  const primitivesView = useInView({ threshold: 0.05 });
  const benchmark = useInView({ threshold: 0.05 });
  const gates = useInView({ threshold: 0.05 });
  const apiSection = useInView({ threshold: 0.05 });

  useEffect(() => {
    document.title = "OrchestrateOS — Deterministic Agent Workflow Execution";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "Governance-first agent orchestration: approval gates, audit trails, and deterministic resume for LangGraph, CrewAI, and Python — without Azure or LangSmith lock-in."
      );
    }
    return () => {
      document.title = `${new URL(siteOrigin()).hostname} — AI Consultancy`;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0D17]">
      <OrchestrateOSNavbar />

      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-20">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0D17] via-[#12102A] to-[#0B0D17]" />
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-[#8B5CF6]/10 rounded-full blur-[180px]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-[#06B6D4]/8 rounded-full blur-[160px]" />

        <div className="container relative z-10 py-16 lg:py-24" ref={hero.ref}>
          <div
            className={`max-w-4xl transition-all duration-700 ${
              hero.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] mb-6">
              <span className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-pulse" />
              <span className="text-xs text-white/50 tracking-wide uppercase font-[Montserrat]">
                resume_engine · Python 3.11+
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white font-[Montserrat] leading-[1.08] mb-6">
              Agent workflows that{" "}
              <span className="gradient-text">resume</span>, not restart
            </h1>

            <p className="text-lg sm:text-xl text-white/55 leading-relaxed max-w-2xl mb-10">
              Developer frameworks bolt on enterprise features. OrchestrateOS makes governance,
              auditability, and deterministic resume first-class — when step 47 fails, you
              re-run step 47 with operator gates, not a blind restart from step 1.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={CALENDLY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white font-semibold font-[Montserrat] hover:opacity-90 transition-opacity shadow-xl shadow-violet-500/25"
              >
                Request Early Access
                <ArrowUpRight className="w-4 h-4" />
              </a>
              <a
                href={orchestrateOSApiDocsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl glass-card text-white/80 font-medium hover:text-white transition-colors"
              >
                <GitBranch className="w-4 h-4 text-[#06B6D4]" />
                API docs
              </a>
              <Link
                href="/install"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl glass-card text-white/80 font-medium hover:text-white transition-colors font-mono text-sm"
              >
                pip install resume_engine
              </Link>
            </div>

            <p className="mt-8 text-sm text-white/30">
              Control plane:{" "}
              <a
                href={orchestrateOSApiDocsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#06B6D4]/80 hover:text-[#06B6D4] font-mono text-xs"
              >
                {orchestrateOSApiBaseUrl().replace("https://", "")}
              </a>
              {" · "}SQLite or Postgres · LangGraph / CrewAI adapters
            </p>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section id="problem" className="relative py-20 lg:py-28">
        <div className="absolute inset-0 bg-[#0B0D17]" />
        <div className="container relative z-10" ref={problem.ref}>
          <div
            className={`text-center mb-14 transition-all duration-700 ${
              problem.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="text-sm font-medium text-[#8B5CF6] tracking-widest uppercase font-[Montserrat] mb-4 block">
              The gap we close
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-[Montserrat]">
              Multi-step agents fail mid-flight.{" "}
              <span className="gradient-text">Most frameworks restart from zero.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {competitors.map((item, i) => (
              <div
                key={item.name}
                className={`glass-card rounded-2xl p-6 lg:p-8 transition-all duration-700 ${
                  problem.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${150 * i + 100}ms` }}
              >
                <p className="text-sm text-[#8B5CF6] font-semibold font-[Montserrat] mb-2">
                  {item.name}
                </p>
                <p className="text-white/55 text-sm leading-relaxed">{item.issue}</p>
              </div>
            ))}
          </div>

          <div
            className={`mt-10 glass-card rounded-2xl p-6 lg:p-8 border-[#06B6D4]/20 transition-all duration-700 ${
              problem.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "500ms" }}
          >
            <p className="text-white/80 text-lg leading-relaxed text-center max-w-3xl mx-auto">
              The gap between &ldquo;agents running in production&rdquo; and{" "}
              <strong className="text-white font-[Montserrat]">auditable, governed, deterministic workflows</strong>{" "}
              is where OrchestrateOS competes — checkpoints, idempotency, compensation gates, and
              human approval before resume.
            </p>
          </div>
        </div>
      </section>

      {/* Governance comparison */}
      <section id="compare" className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0D17] via-[#0E1225] to-[#0B0D17]" />
        <div className="container relative z-10" ref={compare.ref}>
          <div
            className={`text-center mb-12 transition-all duration-700 ${
              compare.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="text-sm font-medium text-[#06B6D4] tracking-widest uppercase font-[Montserrat] mb-4 block">
              Competitive intel
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-[Montserrat] mb-4">
              The <span className="gradient-text">governance gap</span> in agent frameworks
            </h2>
            <p className="text-white/45 max-w-2xl mx-auto">
              LangSmith monitors. CrewAI restarts. Azure governs — if you stay on Foundry.
              OrchestrateOS ships deployment governance, audit trails, and resume gates as core
              primitives, not a $60K+ enterprise add-on.
            </p>
          </div>
          <div
            className={`transition-all duration-700 ${
              compare.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "150ms" }}
          >
            <OrchestrateOSComparison />
          </div>
          <div
            className={`mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-700 ${
              compare.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "300ms" }}
          >
            <div className="glass-card rounded-2xl p-6 border-[#8B5CF6]/15">
              <p className="text-xs uppercase tracking-wider text-[#8B5CF6] font-[Montserrat] mb-2">
                Healthcare &amp; finance
              </p>
              <p className="text-white/55 text-sm leading-relaxed">
                Regulated teams need data sovereignty, immutable execution logs, and operator
                approval before retry — without CrewAI Enterprise pricing or LangSmith trace
                residency tradeoffs.{" "}
                <Link href="/compliance" className="text-[#06B6D4] hover:underline">
                  Compliance overview →
                </Link>
              </p>
            </div>
            <div className="glass-card rounded-2xl p-6 border-[#06B6D4]/15">
              <p className="text-xs uppercase tracking-wider text-[#06B6D4] font-[Montserrat] mb-2">
                Multi-framework buyers
              </p>
              <p className="text-white/55 text-sm leading-relaxed">
                Keep LangGraph or CrewAI definitions. Add OrchestrateOS for the control plane
                Microsoft buyers get only inside Azure — approval gates, compensation, and
                deterministic replay across your stack.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Primitives */}
      <section id="primitives" className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0D17] via-[#0E1225] to-[#0B0D17]" />
        <div className="container relative z-10" ref={primitivesView.ref}>
          <div
            className={`text-center mb-14 transition-all duration-700 ${
              primitivesView.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="text-sm font-medium text-[#06B6D4] tracking-widest uppercase font-[Montserrat] mb-4 block">
              Core primitives
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-[Montserrat]">
              Five guarantees built into{" "}
              <span className="gradient-text">resume_engine</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {primitives.map((item, i) => (
              <div
                key={item.title}
                className={`glass-card rounded-2xl p-6 lg:p-7 transition-all duration-700 ${
                  primitivesView.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${100 * i + 150}ms` }}
              >
                <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/15 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-[#8B5CF6]" />
                </div>
                <h3 className="text-lg font-bold text-white font-[Montserrat] mb-2">
                  {item.title}
                </h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          <div
            className={`glass-card rounded-2xl p-6 lg:p-8 transition-all duration-700 ${
              primitivesView.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "600ms" }}
          >
            <p className="text-sm text-white/40 uppercase tracking-wider mb-4 font-[Montserrat]">
              Drop-in adapters
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {adapters.map((a) => (
                <div
                  key={a.name}
                  className="flex items-start gap-3 rounded-xl bg-white/[0.03] p-4 border border-white/[0.05]"
                >
                  <CheckCircle2 className="w-5 h-5 text-[#06B6D4] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-semibold text-sm font-[Montserrat]">{a.name}</p>
                    <p className="text-white/45 text-xs mt-1">{a.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quickstart */}
      <section id="quickstart" className="relative py-20 lg:py-28">
        <div className="absolute inset-0 bg-[#0B0D17]" />
        <div className="container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
            <div>
              <span className="text-sm font-medium text-[#06B6D4] tracking-widest uppercase font-[Montserrat] mb-4 block">
                Quickstart
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white font-[Montserrat] mb-5">
                Wrap your pipeline in{" "}
                <span className="gradient-text">minutes</span>
              </h2>
              <p className="text-white/50 leading-relaxed mb-6">
                Install the core engine, define your steps, and call{" "}
                <code className="text-[#06B6D4]">resume()</code> on failure. LangGraph and
                CrewAI wrappers require no changes to your existing workflow topology.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "pip install resume_engine (SQLAlchemy core)",
                  "Optional: FastAPI control plane, LangGraph, CrewAI extras",
                  "SQLite for local dev · Postgres for production",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2 text-sm text-white/55">
                    <CheckCircle2 className="w-4 h-4 text-[#8B5CF6] shrink-0 mt-0.5" />
                    {line}
                  </li>
                ))}
              </ul>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[#06B6D4] hover:text-[#06B6D4]/80 transition-colors"
              >
                View source on GitHub
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden border-[#8B5CF6]/15">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                <span className="w-3 h-3 rounded-full bg-red-500/70" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <span className="w-3 h-3 rounded-full bg-green-500/70" />
                <span className="ml-2 text-xs text-white/30 font-mono">pipeline.py</span>
              </div>
              <pre className="p-5 lg:p-6 overflow-x-auto text-[13px] leading-relaxed font-mono text-white/75">
                <code>{quickstartCode}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Resume gates */}
      <section id="gates" className="relative py-20 lg:py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0D17] via-[#12102A] to-[#0B0D17]" />
        <div className="container relative z-10" ref={gates.ref}>
          <div
            className={`text-center mb-12 transition-all duration-700 ${
              gates.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="text-sm font-medium text-[#8B5CF6] tracking-widest uppercase font-[Montserrat] mb-4 block">
              Failure gates
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-[Montserrat] mb-4">
              Partial and permanent failures{" "}
              <span className="gradient-text">don&apos;t auto-resume</span>
            </h2>
            <p className="text-white/45 max-w-2xl mx-auto">
              Transient errors retry immediately. Partial failures require compensation. Permanent
              failures require operator approval. Explore the gate flow below or query a live run.
            </p>
          </div>
          <div
            className={`max-w-4xl mx-auto transition-all duration-700 ${
              gates.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "150ms" }}
          >
            <OrchestrateOSGatePanel />
          </div>
        </div>
      </section>

      {/* Control plane API */}
      <section id="api" className="relative py-20 lg:py-28">
        <div className="absolute inset-0 bg-[#0B0D17]" />
        <div className="container relative z-10" ref={apiSection.ref}>
          <div
            className={`text-center mb-12 transition-all duration-700 ${
              apiSection.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="text-sm font-medium text-[#06B6D4] tracking-widest uppercase font-[Montserrat] mb-4 block">
              Control plane
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-[Montserrat]">
              <span className="gradient-text">{orchestrateOSApiBaseUrl().replace("https://", "")}</span>
            </h2>
          </div>
          <div
            className={`transition-all duration-700 ${
              apiSection.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "150ms" }}
          >
            <OrchestrateOSApiSection />
          </div>
        </div>
      </section>

      {/* Benchmark */}
      <section id="benchmark" className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0D17] via-[#12102A] to-[#0B0D17]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#8B5CF6]/5 rounded-full blur-[200px]" />
        <div className="container relative z-10" ref={benchmark.ref}>
          <div
            className={`text-center mb-14 transition-all duration-700 ${
              benchmark.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="text-sm font-medium text-[#8B5CF6] tracking-widest uppercase font-[Montserrat] mb-4 block">
              Measured impact
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-[Montserrat]">
              50-step workflow · failure at step{" "}
              <span className="gradient-text">47</span>
            </h2>
            <p className="text-white/45 mt-4 max-w-xl mx-auto">
              Simulated LLM pipeline comparing naive restart vs resume_engine resume path.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div
              className={`glass-card rounded-2xl p-8 border-red-500/10 transition-all duration-700 ${
                benchmark.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
            >
              <p className="text-sm text-red-400/80 uppercase tracking-wider mb-2 font-[Montserrat]">
                Naive restart
              </p>
              <p className="text-4xl font-bold text-white font-[Montserrat] mb-1">97</p>
              <p className="text-white/40 text-sm mb-4">total step executions</p>
              <p className="text-white/50 text-sm">
                Re-runs steps 1–46 unnecessarily, then completes 47–50.
              </p>
              <p className="mt-4 text-red-400/70 text-sm font-mono">~$0.35 simulated cost</p>
            </div>

            <div
              className={`glass-card rounded-2xl p-8 border-[#06B6D4]/20 transition-all duration-700 ${
                benchmark.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: "150ms" }}
            >
              <p className="text-sm text-[#06B6D4] uppercase tracking-wider mb-2 font-[Montserrat]">
                OrchestrateOS resume
              </p>
              <p className="text-4xl font-bold text-white font-[Montserrat] mb-1">50</p>
              <p className="text-white/40 text-sm mb-4">total step executions</p>
              <p className="text-white/50 text-sm">
                Skips completed steps 1–46. Re-runs only 47–50.
              </p>
              <p className="mt-4 text-[#06B6D4] text-sm font-mono">~$0.18 simulated cost · 48% saved</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 border-t border-white/[0.04]">
        <div className="container text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-[Montserrat] mb-4">
            Ship deterministic agents to production
          </h2>
          <p className="text-white/45 max-w-lg mx-auto mb-8">
            OrchestrateOS is in early access for teams evaluating LangChain, CrewAI, or Azure
            agents who need governed, resumable workflows — without custom orchestration
            engineering.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white font-semibold font-[Montserrat] hover:opacity-90 transition-opacity"
            >
              Schedule a briefing
              <ArrowUpRight className="w-4 h-4" />
            </a>
            <a
              href={mainSiteUrl()}
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl glass-card text-white/70 hover:text-white transition-colors"
            >
              Back to {new URL(mainSiteUrl()).hostname}
            </a>
          </div>
        </div>
      </section>

      {/* Early access */}
      <section id="early-access" className="py-20 border-t border-white/[0.04]">
        <div className="container max-w-3xl">
          <h2 className="text-3xl font-bold text-white font-[Montserrat] mb-3">Request early access</h2>
          <p className="text-white/50 mb-8">
            Tell us about your multi-step agent workflow. We onboard design partners with governed
            resume on LangGraph, CrewAI, or plain Python.
          </p>
          <LeadCaptureForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#080A12] border-t border-white/[0.04] py-10">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} AI Tech Pros, Inc. · OrchestrateOS
          </p>
          <div className="flex flex-wrap gap-6 justify-center">
            <Link href="/governance" className="text-xs text-white/30 hover:text-white/50 transition-colors">
              Governance
            </Link>
            <Link href="/compliance" className="text-xs text-white/30 hover:text-white/50 transition-colors">
              Compliance
            </Link>
            <Link href="/install" className="text-xs text-white/30 hover:text-white/50 transition-colors">
              Install
            </Link>
            <Link href="/compare" className="text-xs text-white/30 hover:text-white/50 transition-colors">
              Compare (PDF)
            </Link>
            <Link href="/privacy" className="text-xs text-white/30 hover:text-white/50 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-xs text-white/30 hover:text-white/50 transition-colors">
              Terms
            </Link>
            <a
              href={orchestrateOSApiDocsUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-white/30 hover:text-white/50 transition-colors"
            >
              API docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
