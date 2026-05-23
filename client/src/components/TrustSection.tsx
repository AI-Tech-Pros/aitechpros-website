/*
 * Design: Quantum Glass — Luminous Glassmorphism
 * Proof of execution section
 * Production workflows + featured implementation
 */
import { useInView } from "@/hooks/useInView";
import { ArrowUpRight, ShieldCheck, Workflow, TrendingUp } from "lucide-react";

const caseStudies = [
  {
    industry: "Enterprise Use Case 01",
    title: "Multi-System Automation",
    description:
      "Agents securely log into legacy ERPs, update customer CRMs, and trigger compliance alerts in sequence while maintaining full run-state continuity and auditable event history.",
    metrics: [
      { icon: Workflow, value: "Legacy -> CRM", label: "System Chain" },
      { icon: ShieldCheck, value: "Audit-Ready", label: "Execution Trace" },
    ],
    color: "from-[#3B82F6] to-[#1D4ED8]",
  },
  {
    industry: "Enterprise Use Case 02",
    title: "Predictive Risk Mitigation",
    description:
      "Autonomous triage engines cross-reference fragmented data sources to surface fraud signals, operational bottlenecks, and anomaly patterns before they become high-cost incidents.",
    metrics: [
      { icon: TrendingUp, value: "Proactive", label: "Risk Detection" },
      { icon: ShieldCheck, value: "Controlled", label: "Escalation Flow" },
    ],
    color: "from-[#06B6D4] to-[#0891B2]",
  },
  {
    industry: "Enterprise Use Case 03",
    title: "Deterministic Financial Workflowing",
    description:
      "Guardrailed autonomous flows process high-volume finance decisions, then route any high-value exceptions to mandatory human approvals before downstream systems are updated.",
    metrics: [
      { icon: ShieldCheck, value: "HITL", label: "Approval Gates" },
      { icon: Workflow, value: "Rollback", label: "Safe Fallbacks" },
    ],
    color: "from-[#8B5CF6] to-[#6D28D9]",
  },
];

export default function TrustSection() {
  const { ref, isInView } = useInView({ threshold: 0.05 });
  const { ref: caseRef, isInView: caseInView } = useInView({ threshold: 0.05 });

  return (
    <section id="trust" className="relative py-16 lg:py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0B0D17]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#3B82F6]/3 rounded-full blur-[200px]" />

      <div className="container relative z-10" ref={ref}>
        <div
          className={`text-center mb-12 lg:mb-16 transition-all duration-700 ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="text-sm font-medium text-[#06B6D4] tracking-widest uppercase font-[Montserrat] mb-4 block">
            High-Yield Workflows in Production Today
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-[Montserrat]">
            We Don&apos;t Sell Shelfware. We <span className="gradient-text">Co-Build Runtime Outcomes.</span>
          </h2>
          <p className="text-white/50 max-w-3xl mx-auto text-lg leading-relaxed mt-5">
            Our orchestration layer is powering real enterprise workflows right now, with governance controls designed for regulated operations and mission-critical execution.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {caseStudies.map((study, i) => (
            <div
              key={study.title}
              className={`glass-card rounded-2xl overflow-hidden group transition-all duration-700 ${
                isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${150 * i + 200}ms` }}
            >
              <div className={`h-1 bg-gradient-to-r ${study.color}`} />
              <div className="p-6 lg:p-7">
                <span className="text-xs text-[#06B6D4] bg-[#06B6D4]/10 border border-[#06B6D4]/15 px-3 py-1 rounded-full font-medium">
                  {study.industry}
                </span>

                <h3 className="text-lg font-bold text-white font-[Montserrat] mt-4 mb-3">
                  {study.title}
                </h3>

                <p className="text-sm text-white/45 leading-relaxed mb-6">
                  {study.description}
                </p>

                <div className="flex gap-6 pt-4 border-t border-white/[0.06]">
                  {study.metrics.map((metric) => (
                    <div key={metric.label} className="flex items-center gap-2">
                      <metric.icon className="w-4 h-4 text-[#3B82F6]" />
                      <div>
                        <div className="text-base font-bold text-white font-[Montserrat]">
                          {metric.value}
                        </div>
                        <div className="text-xs text-white/35">{metric.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          ref={caseRef}
          className={`glass-card rounded-2xl p-6 lg:p-8 mt-10 transition-all duration-700 ${
            caseInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "650ms" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs uppercase tracking-[0.2em] text-[#06B6D4] font-[Montserrat]">
              Featured Implementation
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white font-[Montserrat] mb-3">
            NegotiateMedicalBill.ai
          </h3>
          <p className="text-sm text-white/55 leading-relaxed">
            A live, production-grade platform hosted on Google Cloud Platform. It leverages our core orchestration layer to navigate complex financial data structures, handle sensitive healthcare compliance constraints, and autonomously execute multi-step medical bill evaluations with deterministic governance.
          </p>
          <a
            href="https://negotiatemedicalbill.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 text-[#3B82F6] hover:text-[#06B6D4] transition-colors font-semibold"
          >
            Visit production implementation
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Bottom divider */}
      <div className="gradient-divider mt-10" />
    </section>
  );
}
