/*
 * Design: Quantum Glass — Luminous Glassmorphism
 * Design Partner Program: Replaces old Services section
 * Shows how AITechPros partners deeply with 3-5 companies
 * Venture-worthy, selective, high-signal
 */
import { useInView } from "@/hooks/useInView";
import { Handshake, Layers, Rocket, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: Handshake,
    phase: "01",
    title: "Deep Discovery & Alignment",
    description:
      "We select 3–5 companies per cohort whose AI challenges align with our platform thesis. Through intensive workshops, we map your highest-value automation targets and define a joint success framework.",
    details: [
      "Executive alignment sessions",
      "Workflow & data landscape audit",
      "Joint KPI definition",
      "Mutual NDA & IP framework",
    ],
  },
  {
    icon: Layers,
    phase: "02",
    title: "Bespoke Agentic Build",
    description:
      "Our engineering team embeds alongside yours to architect and deploy custom agentic workflows on our proprietary orchestration layer. Every solution is purpose-built, not templated.",
    details: [
      "Custom agent architecture design",
      "Multi-model routing & memory layer",
      "Human-in-the-loop guardrails",
      "Continuous iteration cycles",
    ],
  },
  {
    icon: Rocket,
    phase: "03",
    title: "Platform Generalization",
    description:
      "The patterns and primitives proven through your deployment feed back into our scalable platform. Design partners receive perpetual preferred pricing and early access to every future capability.",
    details: [
      "Pattern extraction & abstraction",
      "Platform feature contribution",
      "Preferred pricing in perpetuity",
      "Priority access to new releases",
    ],
  },
];

export default function DesignPartnerSection() {
  const { ref, isInView } = useInView({ threshold: 0.05 });

  return (
    <section id="partners" className="relative py-16 lg:py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0B0D17]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#3B82F6]/5 rounded-full blur-[150px]" />

      <div className="container relative z-10" ref={ref}>
        {/* Section header */}
        <div
          className={`text-center mb-16 lg:mb-20 transition-all duration-700 ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="text-sm font-medium text-[#06B6D4] tracking-widest uppercase font-[Montserrat] mb-4 block">
            How We Partner
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-[Montserrat] mb-5">
            The Design <span className="gradient-text">Partner Program</span>
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto text-lg leading-relaxed">
            We don't sell services — we co-build the future. A select cohort of forward-thinking enterprises helps us refine our agentic orchestration engine while receiving bespoke AI solutions that eventually become part of our scalable platform.
          </p>
        </div>

        {/* Partnership steps — horizontal timeline on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className={`glass-card rounded-2xl overflow-hidden group transition-all duration-700 ${
                isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${150 * i + 200}ms` }}
            >
              {/* Phase header */}
              <div className="p-6 lg:p-7 pb-0">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#3B82F6]/15 to-[#06B6D4]/15 border border-white/[0.06] flex items-center justify-center shrink-0 group-hover:border-[#3B82F6]/30 transition-colors duration-300">
                    <step.icon className="w-5 h-5 text-[#3B82F6]" />
                  </div>
                  <span className="text-xs font-bold text-[#06B6D4]/60 tracking-widest uppercase font-[Montserrat]">
                    Phase {step.phase}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white font-[Montserrat] mb-3">
                  {step.title}
                </h3>
                <p className="text-white/50 text-sm leading-relaxed mb-5">
                  {step.description}
                </p>
              </div>

              {/* Details */}
              <div className="px-6 lg:px-7 pb-6 lg:pb-7">
                <div className="pt-4 border-t border-white/[0.06] space-y-2.5">
                  {step.details.map((detail) => (
                    <div key={detail} className="flex items-center gap-2.5">
                      <ArrowRight className="w-3.5 h-3.5 text-[#3B82F6] shrink-0" />
                      <span className="text-sm text-white/45">{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Selectivity signal */}
        <div
          className={`glass-card rounded-2xl p-8 lg:p-10 mt-12 text-center transition-all duration-700 ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "700ms" }}
        >
          <p className="text-white/60 text-base lg:text-lg leading-relaxed max-w-3xl mx-auto">
            <span className="text-white font-semibold">Cohort 1 is currently in progress.</span>{" "}
            We are now accepting applications for{" "}
            <span className="gradient-text font-semibold">Cohort 2 (Q3 2026)</span>. Ideal partners are growth-stage enterprises with complex, multi-system workflows and a willingness to co-develop at the frontier of autonomous AI.
          </p>
          <button
            onClick={() => document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" })}
            className="glow-btn text-white font-semibold px-8 py-3.5 rounded-lg text-sm mt-6 inline-flex items-center gap-2 group"
          >
            Apply for Cohort 2
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Bottom divider */}
      <div className="gradient-divider mt-10" />
    </section>
  );
}
