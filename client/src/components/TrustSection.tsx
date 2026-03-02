/*
 * Design: Quantum Glass — Luminous Glassmorphism
 * Trust: Logo marquee for Partnered Tech + Case Studies grid
 * Glassmorphism cards with hover glow effects
 * Using CSS transitions with IntersectionObserver
 */
import { useInView } from "@/hooks/useInView";
import { ArrowUpRight, TrendingUp, Clock, DollarSign } from "lucide-react";

/* Partner logos rendered as styled text badges */
const partners = [
  "Microsoft Azure",
  "Google Cloud",
  "AWS",
  "NVIDIA",
  "Databricks",
  "Snowflake",
  "OpenAI",
  "Anthropic",
  "Hugging Face",
  "MongoDB",
  "LangChain",
  "CrewAI",
];

const caseStudies = [
  {
    industry: "Financial Services",
    title: "Fraud Detection AI Reduces Losses by 73%",
    description:
      "Deployed a real-time ML pipeline for a top-10 US bank, processing 2M+ transactions daily with sub-50ms latency. Reduced false positives by 60% while catching 73% more fraudulent activity.",
    metrics: [
      { icon: TrendingUp, value: "73%", label: "Fraud Reduction" },
      { icon: Clock, value: "<50ms", label: "Latency" },
    ],
    color: "from-[#3B82F6] to-[#1D4ED8]",
  },
  {
    industry: "Healthcare",
    title: "Agentic AI Orchestrates Patient Triage 4x Faster",
    description:
      "Deployed a multi-agent system for a leading hospital network where autonomous AI agents analyze intake forms, cross-reference medical histories, and coordinate lab prioritization, reducing triage time from 45 to 11 minutes with full human-in-the-loop oversight.",
    metrics: [
      { icon: TrendingUp, value: "4x", label: "Faster Triage" },
      { icon: Clock, value: "11 min", label: "Avg. Processing" },
    ],
    color: "from-[#06B6D4] to-[#0891B2]",
  },
  {
    industry: "Manufacturing",
    title: "Predictive Maintenance Saves $18M Annually",
    description:
      "Implemented IoT-connected ML models across 12 production facilities, predicting equipment failures 72 hours in advance. Reduced unplanned downtime by 89% and maintenance costs by 42%.",
    metrics: [
      { icon: DollarSign, value: "$18M", label: "Annual Savings" },
      { icon: TrendingUp, value: "89%", label: "Less Downtime" },
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

      <div className="container relative z-10">
        {/* Partnered Tech — Logo Marquee */}
        <div ref={ref}>
          <div
            className={`text-center mb-12 transition-all duration-700 ${
              isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="text-sm font-medium text-[#06B6D4] tracking-widest uppercase font-[Montserrat] mb-4 block">
              Partnered Tech
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-[Montserrat] mb-5">
              Trusted by <span className="gradient-text">Industry Leaders</span>
            </h2>
            <p className="text-white/50 max-w-xl mx-auto text-lg">
              We partner with the world's leading technology and agentic AI platforms to deliver best-in-class autonomous solutions.
            </p>
          </div>

          {/* Logo marquee */}
          <div
            className={`relative overflow-hidden py-8 mb-20 transition-all duration-800 ${
              isInView ? "opacity-100" : "opacity-0"
            }`}
            style={{ transitionDelay: "300ms" }}
          >
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#0B0D17] to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#0B0D17] to-transparent z-10" />

            <div className="flex animate-marquee whitespace-nowrap">
              {[...partners, ...partners].map((partner, i) => (
                <div
                  key={`${partner}-${i}`}
                  className="inline-flex items-center justify-center mx-6 lg:mx-8"
                >
                  <div className="glass-card px-6 py-3 rounded-xl">
                    <span className="text-white/40 font-semibold text-sm lg:text-base font-[Montserrat] whitespace-nowrap">
                      {partner}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Case Studies */}
        <div ref={caseRef}>
          <div
            className={`text-center mb-12 lg:mb-16 transition-all duration-700 ${
              caseInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="text-sm font-medium text-[#06B6D4] tracking-widest uppercase font-[Montserrat] mb-4 block">
              Results That Speak
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-[Montserrat]">
              Case <span className="gradient-text">Studies</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {caseStudies.map((study, i) => (
              <div
                key={study.title}
                className={`glass-card rounded-2xl overflow-hidden group cursor-pointer transition-all duration-700 ${
                  caseInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${150 * i + 200}ms` }}
              >
                {/* Gradient top bar */}
                <div className={`h-1 bg-gradient-to-r ${study.color}`} />

                <div className="p-6 lg:p-7">
                  {/* Industry tag */}
                  <span className="text-xs text-[#06B6D4] bg-[#06B6D4]/10 border border-[#06B6D4]/15 px-3 py-1 rounded-full font-medium">
                    {study.industry}
                  </span>

                  <h3 className="text-lg font-bold text-white font-[Montserrat] mt-4 mb-3 group-hover:text-[#3B82F6] transition-colors duration-300 flex items-start gap-2">
                    {study.title}
                    <ArrowUpRight className="w-4 h-4 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>

                  <p className="text-sm text-white/45 leading-relaxed mb-6">
                    {study.description}
                  </p>

                  {/* Metrics */}
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
        </div>
      </div>

      {/* Bottom divider */}
      <div className="gradient-divider mt-10" />
    </section>
  );
}
