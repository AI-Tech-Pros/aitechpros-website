/*
 * Design: Quantum Glass — Luminous Glassmorphism
 * Engine architecture + control model
 * Tone: technical authority, operational clarity
 */
import { useInView } from "@/hooks/useInView";
import { ShieldCheck, Route, UserCheck } from "lucide-react";

const controlPillars = [
  {
    icon: ShieldCheck,
    title: "Secure-by-Design Infrastructure",
    description:
      "Built by U.S. military veterans with a mission-first mentality. Our zero-trust runtime architecture aligns with strict CIS benchmark controls so sensitive enterprise data stays inside your compliance boundary.",
  },
  {
    icon: Route,
    title: "Dynamic Multi-Model Routing",
    description:
      "Avoid vendor lock-in. The orchestration engine evaluates each sub-task at runtime and routes to the fastest, lowest-cost, or highest-capability model across OpenAI, Claude, and Gemini workloads.",
  },
  {
    icon: UserCheck,
    title: "Deterministic Guardrails + Human Approval",
    description:
      "AI is probabilistic. Your business logic cannot be. Define strict boundaries, automated rollback rules, and mandatory human verification gates before high-impact financial or operational actions execute.",
  },
];

export default function TechEdgeSection() {
  const { ref, isInView } = useInView({ threshold: 0.05 });

  return (
    <section id="tech-edge" className="relative py-16 lg:py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0D17] via-[#0E1225] to-[#0B0D17]" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#06B6D4]/5 rounded-full blur-[150px] animate-float-delayed" />
      <div className="absolute top-1/3 -left-20 w-[400px] h-[400px] bg-[#3B82F6]/5 rounded-full blur-[120px] animate-float" />

      <div className="container relative z-10" ref={ref}>
        {/* Section header */}
        <div
          className={`text-center mb-16 transition-all duration-700 ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="text-sm font-medium text-[#06B6D4] tracking-widest uppercase font-[Montserrat] mb-4 block">
            Meet the AITechPros Orchestration Engine
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-[Montserrat] mb-5">
            The Invisible Nervous System for Your <span className="gradient-text">Enterprise Stack</span>
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto text-lg leading-relaxed">
            AITechPros provides a proprietary agentic orchestration layer that sits securely between your legacy infrastructure and leading AI models, enabling safe autonomous execution across multi-system enterprise workflows.
          </p>
        </div>

        {/* Architecture map */}
        <div
          className={`glass-card rounded-2xl overflow-hidden mb-14 transition-all duration-700 ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "200ms" }}
        >
          <div className="p-6 lg:p-9">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-center gap-6">
              <div className="glass-card rounded-xl p-4 text-center">
                <p className="text-sm text-white/45 mb-1">Your Legacy Stack</p>
                <p className="text-base text-white font-semibold font-[Montserrat]">
                  ERP / CRM / DB
                </p>
              </div>
              <p className="text-[#3B82F6] text-2xl font-bold text-center">↕</p>
              <div className="glass-card rounded-xl p-5 border-[#3B82F6]/30 text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-[#06B6D4] mb-2">
                  Secure Zero-Trust Runtime
                </p>
                <p className="text-lg text-white font-bold font-[Montserrat]">
                  AITechPros Agentic Orchestration Engine
                </p>
              </div>
            </div>
            <div className="flex justify-center py-3 text-[#3B82F6] text-2xl font-bold">↕</div>
            <div className="glass-card rounded-xl p-4 text-center">
              <p className="text-sm text-white/45 mb-1">Multi-Model Routing</p>
              <p className="text-base text-white font-semibold font-[Montserrat]">
                OpenAI / Claude / Gemini
              </p>
            </div>
          </div>
          <div className="px-6 pb-6 flex items-center gap-2">
            <span className="text-xs text-white/30 font-[Montserrat]">
              Runtime placement between enterprise systems and model layer
            </span>
          </div>
        </div>

        {/* Control pillars */}
        <div className="text-center mb-8">
          <h3 className="text-2xl sm:text-3xl font-bold text-white font-[Montserrat]">
            Engineered for <span className="gradient-text">Absolute Control</span>
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {controlPillars.map((pillar, i) => (
            <div
              key={pillar.title}
              className={`glass-card rounded-xl p-6 group transition-all duration-700 ${
                isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${100 * i + 400}ms` }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B82F6]/15 to-[#06B6D4]/15 border border-white/[0.06] flex items-center justify-center mb-4 group-hover:border-[#3B82F6]/30 transition-colors duration-300">
                <pillar.icon className="w-5 h-5 text-[#3B82F6]" />
              </div>
              <h3 className="text-base font-semibold text-white font-[Montserrat] mb-2">
                {pillar.title}
              </h3>
              <p className="text-sm text-white/45 leading-relaxed">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom divider */}
      <div className="gradient-divider mt-10" />
    </section>
  );
}
