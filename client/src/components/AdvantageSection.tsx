/*
 * Design: Quantum Glass — Luminous Glassmorphism
 * Advantage: Split layout — left text block with stats, right generated 3D team visual
 * Glassmorphism stat cards with count-up animation
 * Using CSS transitions with IntersectionObserver
 */
import { useInView } from "@/hooks/useInView";
import { useCountUp } from "@/hooks/useCountUp";
import { Shield, Award, Users, Zap } from "lucide-react";

const TEAM_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663028368274/RDzc8Kay9NxmabXz39Hgzg/team-advantage-gUzBStubMhviwoBFUBQLW5.webp";

const advantages = [
  {
    icon: Users,
    title: "Veteran AI & Agentic Systems Engineers",
    description: "Our team averages 12+ years in ML/AI and agentic system design, with PhDs from leading research institutions and deep experience building autonomous agent architectures at Fortune 500 scale.",
  },
  {
    icon: Shield,
    title: "Enterprise-Grade Security",
    description: "SOC 2 Type II certified with end-to-end encryption, ensuring your proprietary data and models remain fully protected.",
  },
  {
    icon: Award,
    title: "Proven Track Record",
    description: "Over 300 successful AI and agentic system deployments across healthcare, finance, manufacturing, and technology sectors.",
  },
  {
    icon: Zap,
    title: "Rapid Time-to-Value",
    description: "Our agile methodology delivers production-ready AI solutions in weeks, not months — accelerating your competitive edge.",
  },
];

function StatCounter({ end, suffix, label, inView }: { end: number; suffix: string; label: string; inView: boolean }) {
  const count = useCountUp(end, 2000, inView);
  return (
    <div className="text-center">
      <div className="text-3xl lg:text-4xl font-bold gradient-text font-[Montserrat]">
        {count}{suffix}
      </div>
      <div className="text-sm text-white/40 mt-1">{label}</div>
    </div>
  );
}

export default function AdvantageSection() {
  const { ref, isInView } = useInView({ threshold: 0.05 });
  const { ref: statsRef, isInView: statsInView } = useInView({ threshold: 0.2 });

  return (
    <section id="advantage" className="relative py-16 lg:py-20 overflow-hidden">
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
            How We Build
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-[Montserrat] mb-5">
            Our <span className="gradient-text">Build Process</span>
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto text-lg leading-relaxed">
            A battle-tested squad of AI engineers and agentic systems architects who ship production-grade AI solutions at startup speed with enterprise-grade reliability.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Image */}
          <div
            className={`relative transition-all duration-700 ${
              isInView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
            style={{ transitionDelay: "200ms" }}
          >
            <div className="glass-card rounded-2xl overflow-hidden">
              <img
                src={TEAM_IMG}
                alt="AITechPros team of veteran data scientists and engineers"
                className="w-full h-auto"
                loading="lazy"
              />
            </div>
            {/* Decorative glow behind image */}
            <div className="absolute -inset-4 bg-gradient-to-r from-[#3B82F6]/10 to-[#06B6D4]/10 rounded-3xl blur-2xl -z-10" />
          </div>

          {/* Right: Advantage cards */}
          <div className="space-y-5">
            {advantages.map((item, i) => (
              <div
                key={item.title}
                className={`glass-card rounded-xl p-5 flex gap-4 items-start group transition-all duration-600 ${
                  isInView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
                }`}
                style={{ transitionDelay: `${150 * i + 300}ms` }}
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#3B82F6]/15 to-[#06B6D4]/15 border border-white/[0.06] flex items-center justify-center shrink-0 group-hover:border-[#3B82F6]/30 transition-colors duration-300">
                  <item.icon className="w-5 h-5 text-[#3B82F6]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white font-[Montserrat] mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-sm text-white/45 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div
          ref={statsRef}
          className={`glass-card rounded-2xl p-8 lg:p-10 mt-10 lg:mt-14 grid grid-cols-2 lg:grid-cols-4 gap-8 transition-all duration-700 ${
            statsInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "200ms" }}
        >
          <StatCounter end={300} suffix="+" label="AI Deployments" inView={statsInView} />
          <StatCounter end={45} suffix="+" label="Industries Served" inView={statsInView} />
          <StatCounter end={12} suffix="yr" label="Avg. Team Experience" inView={statsInView} />
          <StatCounter end={99} suffix="%" label="On-Time Delivery" inView={statsInView} />
        </div>
      </div>

      {/* Bottom divider */}
      <div className="gradient-divider mt-10" />
    </section>
  );
}
