/*
 * Design: Quantum Glass — Luminous Glassmorphism
 * Roadmap table section
 * Tone: concrete milestones with customer implications
 */
import { useInView } from "@/hooks/useInView";
import { CalendarClock } from "lucide-react";

const milestones = [
  {
    timeline: "Current (Q2 2026)",
    milestone: "Enterprise Co-Building",
    impact:
      "Elite engineering partnerships to deploy your first high-yield use case in 90 days.",
  },
  {
    timeline: "Late 2026",
    milestone: "The Agent Marketplace",
    impact:
      "Access to pre-built, community-tested agent templates for rapid deployment.",
  },
  {
    timeline: "Late 2026",
    milestone: "Usage-Based Platform",
    impact:
      "Transition to a fully scalable pricing framework aligned with your cloud efficiency metrics.",
  },
];

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
            Our 2026 Roadmap
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-[Montserrat] mb-5">
            Scaling Infrastructure for <span className="gradient-text">Engineering Independence</span>
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto text-lg leading-relaxed">
            We are investing in platform depth so your teams can stop building orchestration plumbing and focus on differentiated business logic.
          </p>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-3 border-b border-white/[0.06]">
            <div className="px-5 py-4 text-xs uppercase tracking-[0.2em] text-white/45 font-[Montserrat]">
              Timeline
            </div>
            <div className="px-5 py-4 text-xs uppercase tracking-[0.2em] text-white/45 font-[Montserrat]">
              Milestone
            </div>
            <div className="px-5 py-4 text-xs uppercase tracking-[0.2em] text-white/45 font-[Montserrat]">
              What It Means for You
            </div>
          </div>
          {milestones.map((milestone, i) => {
            return (
              <div
                key={`${milestone.timeline}-${milestone.milestone}`}
                className={`grid grid-cols-1 md:grid-cols-3 border-b border-white/[0.06] last:border-b-0 transition-all duration-700 ${
                  isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${150 * i + 200}ms` }}
              >
                <div className="px-5 pt-5 md:py-5">
                  <p className="md:hidden text-[11px] uppercase tracking-[0.2em] text-white/45 font-[Montserrat] mb-2">
                    Timeline
                  </p>
                  <div className="inline-flex items-center gap-2 text-sm text-white/80">
                    <CalendarClock className="w-4 h-4 text-[#3B82F6]" />
                    {milestone.timeline}
                  </div>
                </div>
                <div className="px-5 py-4 md:py-5 text-sm sm:text-base font-semibold text-white font-[Montserrat]">
                  <p className="md:hidden text-[11px] uppercase tracking-[0.2em] text-white/45 font-[Montserrat] mb-2">
                    Milestone
                  </p>
                  {milestone.milestone}
                </div>
                <div className="px-5 pb-5 md:py-5 text-sm text-white/50 leading-relaxed">
                  <p className="md:hidden text-[11px] uppercase tracking-[0.2em] text-white/45 font-[Montserrat] mb-2">
                    What It Means for You
                  </p>
                  {milestone.impact}
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
