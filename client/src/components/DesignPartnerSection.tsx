/*
 * Design: Quantum Glass — Luminous Glassmorphism
 * Enterprise Dilemma section
 * Problem framing before architecture solution
 */
import { useInView } from "@/hooks/useInView";
import { ShieldAlert, Link2Off, EyeOff, AlertTriangle } from "lucide-react";

const dilemmaItems = [
  {
    icon: ShieldAlert,
    title: "The Security Minefield",
    description:
      "Standard AI model integrations can expose sensitive data paths and break strict control requirements. Enterprises risk failing SOC2, HIPAA, and CIS benchmark expectations when orchestration is not purpose-built for regulated operations.",
  },
  {
    icon: Link2Off,
    title: "Brittle API Glue",
    description:
      "Engineering teams lose quarters stitching LLM endpoints into ERPs, CRMs, and internal data systems. Every model revision or API shift can trigger costly refactors, re-testing, and workflow outages.",
  },
  {
    icon: EyeOff,
    title: "Hype Fatigue",
    description:
      "Leadership teams do not need another UI wrapper or strategy deck. They need durable runtime infrastructure that executes deterministic business logic with auditability and operational stability.",
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
            The AI Dilemma in the Enterprise
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-[Montserrat] mb-5">
            Every Board Wants AI Deployed. <span className="gradient-text">Ops Teams Inherit the Risk.</span>
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto text-lg leading-relaxed">
            The issue is not your data quality or your team’s talent. The issue is a missing secure runtime built to handle autonomous loops safely across legacy and modern systems.
          </p>
        </div>

        {/* Dilemma cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {dilemmaItems.map((item, i) => (
            <div
              key={item.title}
              className={`glass-card rounded-2xl overflow-hidden group transition-all duration-700 ${
                isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${150 * i + 200}ms` }}
            >
              <div className="p-6 lg:p-7">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#3B82F6]/15 to-[#06B6D4]/15 border border-white/[0.06] flex items-center justify-center shrink-0 group-hover:border-[#3B82F6]/30 transition-colors duration-300">
                    <item.icon className="w-5 h-5 text-[#3B82F6]" />
                  </div>
                  <h3 className="text-xl font-bold text-white font-[Montserrat]">
                    {item.title}
                  </h3>
                </div>
                <p className="text-white/50 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Root problem callout */}
        <div
          className={`glass-card rounded-2xl p-8 lg:p-10 mt-12 text-center transition-all duration-700 ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "700ms" }}
        >
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3B82F6]/15 to-[#06B6D4]/15 border border-white/[0.08] flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-[#3B82F6]" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white font-[Montserrat] mb-3">
            The Root Problem
          </h3>
          <p className="text-white/60 text-base lg:text-lg leading-relaxed max-w-3xl mx-auto">
            The gap is not AI capability. The gap is a hardened runtime environment built for deterministic automation, policy enforcement, and safe autonomous execution in enterprise infrastructure.
          </p>
        </div>
      </div>

      {/* Bottom divider */}
      <div className="gradient-divider mt-10" />
    </section>
  );
}
