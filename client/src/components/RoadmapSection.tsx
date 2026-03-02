/*
 * Design: Quantum Glass — Luminous Glassmorphism
 * Roadmap: 12-month vision — Alpha → Beta → Public Launch
 * Horizontal timeline with milestone cards
 * Tone: Forward-looking, ambitious, transparent
 */
import { useInView } from "@/hooks/useInView";
import { FlaskConical, Users, Globe, Sparkles } from "lucide-react";

const milestones = [
  {
    icon: FlaskConical,
    phase: "Alpha",
    period: "Q1–Q2 2026",
    status: "current",
    title: "Core Engine & Cohort 1",
    items: [
      "Proprietary orchestration runtime v0.1",
      "Persistent agentic memory layer",
      "3 design partner deployments",
      "Internal benchmarking suite",
      "SOC 2 Type II certification initiated",
    ],
  },
  {
    icon: Users,
    phase: "Beta",
    period: "Q3 2026",
    status: "upcoming",
    title: "Platform Hardening & Cohort 2",
    items: [
      "Multi-model routing engine v1.0",
      "Self-serve agent builder (private beta)",
      "5 additional design partner deployments",
      "Enterprise SSO & RBAC",
      "Compliance framework for regulated industries",
    ],
  },
  {
    icon: Globe,
    phase: "Public Launch",
    period: "Q4 2026",
    status: "future",
    title: "General Availability",
    items: [
      "Full platform GA with usage-based pricing",
      "Agent marketplace & community templates",
      "Multi-cloud deployment options",
      "Partner ecosystem & integrations API",
      "Strategic growth funding close",
    ],
  },
  {
    icon: Sparkles,
    phase: "Beyond",
    period: "2027+",
    status: "future",
    title: "Autonomous Enterprise",
    items: [
      "Multi-agent swarm coordination",
      "Cross-organization agent federation",
      "Autonomous decision-making frameworks",
      "Industry-specific vertical solutions",
      "Global expansion & enterprise sales",
    ],
  },
];

const statusStyles: Record<string, { dot: string; border: string; badge: string }> = {
  current: {
    dot: "bg-emerald-500",
    border: "border-emerald-500/30",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  upcoming: {
    dot: "bg-[#3B82F6]",
    border: "border-[#3B82F6]/30",
    badge: "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20",
  },
  future: {
    dot: "bg-white/20",
    border: "border-white/[0.08]",
    badge: "bg-white/[0.04] text-white/40 border-white/[0.08]",
  },
};

export default function RoadmapSection() {
  const { ref, isInView } = useInView({ threshold: 0.05 });

  return (
    <section id="roadmap" className="relative py-16 lg:py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0B0D17]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#3B82F6]/3 rounded-full blur-[200px]" />

      <div className="container relative z-10" ref={ref}>
        {/* Section header */}
        <div
          className={`text-center mb-16 transition-all duration-700 ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="text-sm font-medium text-[#06B6D4] tracking-widest uppercase font-[Montserrat] mb-4 block">
            The Vision
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-[Montserrat] mb-5">
            Product <span className="gradient-text">Roadmap</span>
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto text-lg leading-relaxed">
            A transparent look at where we are and where we're headed. We believe in building in public with our design partners.
          </p>
        </div>

        {/* Timeline grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {milestones.map((milestone, i) => {
            const style = statusStyles[milestone.status];
            return (
              <div
                key={milestone.phase}
                className={`glass-card rounded-2xl overflow-hidden group transition-all duration-700 ${style.border} ${
                  isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${150 * i + 200}ms` }}
              >
                <div className="p-6">
                  {/* Phase badge */}
                  <div className="flex items-center justify-between mb-5">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${style.badge} font-[Montserrat] uppercase tracking-wider`}>
                      {milestone.phase}
                    </span>
                    {milestone.status === "current" && (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${style.dot}`} />
                      </span>
                    )}
                  </div>

                  {/* Icon + period */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B82F6]/15 to-[#06B6D4]/15 border border-white/[0.06] flex items-center justify-center shrink-0">
                      <milestone.icon className="w-5 h-5 text-[#3B82F6]" />
                    </div>
                    <span className="text-sm text-white/40 font-[Montserrat] font-medium">
                      {milestone.period}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white font-[Montserrat] mb-4">
                    {milestone.title}
                  </h3>

                  {/* Items */}
                  <ul className="space-y-2.5">
                    {milestone.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${style.dot} mt-1.5 shrink-0`} />
                        <span className="text-sm text-white/40 leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom divider */}
      <div className="gradient-divider mt-10" />
    </section>
  );
}
