/*
 * Design: Quantum Glass — Luminous Glassmorphism
 * Founders Section: Battle-tested, mission-ready autonomous AI engineering narrative
 * Real co-founder photos, military-to-cybersecurity pipeline, Founders' Creed sidebar
 * Tone: Disciplined, technical, resilient — Mission Statement style
 */
import { useInView } from "@/hooks/useInView";
import { Quote, Shield, Crosshair, ShieldCheck, Flame } from "lucide-react";

const NEHEMIAH_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663028368274/RDzc8Kay9NxmabXz39Hgzg/henry-jenkins_0533946c.png";
const HENRY_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663028368274/RDzc8Kay9NxmabXz39Hgzg/nehemiah-harvard_2ffa7dd7.png";

const CREED = [
  {
    icon: Flame,
    title: "Operational Resilience",
    desc: "Thriving under the stress of rapid deployment. We deliver production-grade autonomous systems on compressed timelines because our training taught us to perform when the pressure is highest.",
  },
  {
    icon: ShieldCheck,
    title: "Defensive Engineering",
    desc: "Hardened AI agents built by Cybersecurity experts. Every pipeline, every model endpoint, every data flow is architected with CIS, PCI DSS, and Zero-Trust compliance from day one.",
  },
  {
    icon: Crosshair,
    title: "Mission-Centric Results",
    desc: "Objective-driven code that moves the needle. No feature bloat, no vanity demos. Every deployment is measured by ROI, productivity gains, and mission-critical outcomes.",
  },
];

export default function FoundersSection() {
  const { ref, isInView } = useInView({ threshold: 0.05 });

  return (
    <section id="founders" className="relative py-16 lg:py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0D17] via-[#0E1225] to-[#0B0D17]" />
      <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-[#3B82F6]/5 rounded-full blur-[150px] animate-float" />
      <div className="absolute bottom-1/4 left-0 w-[300px] h-[300px] bg-[#06B6D4]/4 rounded-full blur-[120px] animate-float-delayed" />

      <div className="container relative z-10" ref={ref}>
        {/* Section header */}
        <div
          className={`text-center mb-14 transition-all duration-700 ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="text-sm font-medium text-[#06B6D4] tracking-widest uppercase font-[Montserrat] mb-4 block">
            Battle-Tested &middot; Secure-by-Design
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-[Montserrat]">
            A Mission-Ready Approach to{" "}
            <span className="gradient-text">Autonomous Engineering</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Main founders card — 2/3 width */}
          <div
            className={`xl:col-span-2 glass-card rounded-2xl overflow-hidden transition-all duration-700 ${
              isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "200ms" }}
          >
            {/* Founder portraits row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-7 lg:p-10 pb-0 lg:pb-0">
              {/* Nehemiah */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full overflow-hidden border-2 border-[#3B82F6]/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                    <img
                      src={NEHEMIAH_IMG}
                      alt="Nehemiah Harvard, CEO"
                      className="w-full h-full object-cover object-top"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-[#0B0D17] rounded-full p-0.5">
                    <div className="bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] rounded-full px-2 py-0.5">
                      <span className="text-[10px] font-bold text-white tracking-wide">CEO</span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-white font-semibold font-[Montserrat] text-base lg:text-lg">
                    Nehemiah Harvard
                  </p>
                  <p className="text-white/40 text-xs lg:text-sm">
                    US Air Force Veteran
                  </p>
                  <p className="text-[#06B6D4]/60 text-[11px] lg:text-xs mt-0.5">
                    Autonomous AI Engineer
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="hidden sm:block w-px h-16 bg-white/[0.08]" />

              {/* Henry */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full overflow-hidden border-2 border-[#06B6D4]/30 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                    <img
                      src={HENRY_IMG}
                      alt="Henry Jenkins, CTO"
                      className="w-full h-full object-cover object-top"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-[#0B0D17] rounded-full p-0.5">
                    <div className="bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] rounded-full px-2 py-0.5">
                      <span className="text-[10px] font-bold text-white tracking-wide">CTO</span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-white font-semibold font-[Montserrat] text-base lg:text-lg">
                    Henry Jenkins
                  </p>
                  <p className="text-white/40 text-xs lg:text-sm">
                    US Army Veteran
                  </p>
                  <p className="text-[#06B6D4]/60 text-[11px] lg:text-xs mt-0.5">
                    Cybersecurity &amp; AI Infrastructure
                  </p>
                </div>
              </div>
            </div>

            {/* The Letter */}
            <div className="p-7 lg:p-10">
              <Quote className="w-8 h-8 text-[#3B82F6]/30 mb-5" />

              {/* Quote block */}
              <div className="relative mb-6 pl-5 border-l-2 border-[#3B82F6]/40">
                <p className="text-white/80 text-base lg:text-lg italic leading-relaxed">
                  "In the military, a broken pipeline means mission failure. In enterprise AI, it means wasted millions, stalled roadmaps, and teams that lose faith in the technology altogether. We are battle-tested to ensure that never happens on our watch."
                </p>
              </div>

              <div className="space-y-4 text-white/55 text-[15px] leading-relaxed">
                <p>
                  As veterans of the <span className="text-white/80 font-medium">United States Air Force</span> and <span className="text-white/80 font-medium">United States Army</span>, we are battle-tested to handle the extreme rigors, stress, and rapid decision-making required in high-stakes environments. We operate with a <span className="text-white font-medium">Mission-First mentality</span>, ensuring project completion where others fail due to complexity, pressure, or the sheer volatility of the AI landscape.
                </p>
                <p>
                  We are <span className="text-white font-medium">Autonomous AI Development Engineers</span>, not consultants. Our IT degrees, Cybersecurity certifications, and years of professional experience provide a <span className="gradient-text font-semibold">Secure-by-Design</span> framework for everything we build. We don't just deploy AI agents; we build hardened, autonomous infrastructure that protects the enterprise. Every model endpoint is locked down. Every data pipeline is encrypted in transit and at rest. Every orchestration layer is architected with Zero-Trust principles, CIS benchmarks, and PCI DSS compliance baked in from the first commit.
                </p>
                <p>
                  What sets us apart is <span className="text-white/80 font-medium">Tactical Flexibility</span>: the ability to think fast on our feet and adapt to the volatile, rapidly shifting landscape of AI and global security threats. When a new model architecture drops, we don't wait for a committee to evaluate it. When a client's threat surface changes overnight, we re-architect in hours, not quarters. This is the moat that military intelligence combined with cybersecurity expertise creates — and it cannot be replicated by teams that have never operated under real pressure.
                </p>
                <p>
                  <span className="text-white font-medium">AITechPros is not a consultancy that happens to use AI.</span> We are an AI-native engineering lab building the <span className="gradient-text font-semibold">Autonomous Infrastructure Layer</span> for the next generation of industry. Every agent we deploy, every workflow we architect, every model we fine-tune is designed to operate with the precision of a military operation and the adaptability of a startup that has nothing to lose and everything to prove.
                </p>
                <p>
                  To the founders, CTOs, and investors reading this: we are extending an invitation — not for a vendor relationship, but for a <span className="text-white/80 font-medium">strategic partnership</span> to define the future of agentic workflows. The companies that move now will own the category. We intend to be the autonomous infrastructure they build on.
                </p>
              </div>

              {/* Signature */}
              <div className="mt-8 pt-6 border-t border-white/[0.06]">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-white font-semibold font-[Montserrat] text-base">
                      The Autonomous AI Engineering Team
                    </p>
                    <p className="text-white/40 text-sm mt-0.5">
                      AITechPros.ai — Atlanta, GA
                    </p>
                  </div>
                  <a
                    href="#contact"
                    className="glow-btn px-6 py-3 rounded-lg text-white font-semibold text-sm font-[Montserrat] text-center inline-block"
                  >
                    Request Strategic Partnership →
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Founders' Creed sidebar — 1/3 width */}
          <div
            className={`xl:col-span-1 transition-all duration-700 ${
              isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "400ms" }}
          >
            <div className="glass-card rounded-2xl p-7 lg:p-8 h-full">
              {/* Creed header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3B82F6]/20 to-[#06B6D4]/20 flex items-center justify-center border border-[#3B82F6]/20">
                  <Shield className="w-5 h-5 text-[#3B82F6]" />
                </div>
                <div>
                  <h3 className="text-white font-bold font-[Montserrat] text-lg">
                    Founders' Creed
                  </h3>
                  <p className="text-white/40 text-xs tracking-wide uppercase">
                    Our Operating Principles
                  </p>
                </div>
              </div>

              {/* Creed items */}
              <div className="space-y-5">
                {CREED.map((item, i) => (
                  <div key={i} className="group">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 w-8 h-8 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 group-hover:border-[#3B82F6]/30 transition-colors">
                        <item.icon className="w-4 h-4 text-[#06B6D4]" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm font-[Montserrat] mb-1">
                          {item.title}
                        </p>
                        <p className="text-white/45 text-[13px] leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                    {i < CREED.length - 1 && (
                      <div className="mt-5 h-px bg-white/[0.04]" />
                    )}
                  </div>
                ))}
              </div>

              {/* Bottom accent */}
              <div className="mt-7 pt-5 border-t border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse" />
                  <p className="text-white/30 text-xs font-[Montserrat] tracking-wider uppercase">
                    Discipline &middot; Security &middot; Autonomy
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom divider */}
      <div className="gradient-divider mt-10" />
    </section>
  );
}
