/*
 * Design: Quantum Glass — Luminous Glassmorphism
 * Hero: Stealth-mode venture positioning — autonomous backbone for enterprise
 * Background: Static neural network image + animated canvas overlay (flow + sparkle)
 * Tone: Ambitious, selective, investor-grade
 */
import { useEffect, useState } from "react";
import NeuralNetworkCanvas from "./NeuralNetworkCanvas";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663028368274/RDzc8Kay9NxmabXz39Hgzg/neural-network-hero_5b8079da.png";

export default function HeroSection() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0D17] via-[#0F1629] to-[#0B0D17]" />
        {/* Static neural network image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-50"
          style={{ backgroundImage: `url(${HERO_BG})` }}
        />
        {/* Animated neural network canvas overlay */}
        <NeuralNetworkCanvas />
        {/* Left-side content fade */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0D17]/90 via-[#0B0D17]/60 to-transparent" />
        {/* Ambient glow orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#3B82F6]/10 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-[#06B6D4]/8 rounded-full blur-[100px] animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#3B82F6]/5 rounded-full blur-[150px] animate-float-slow" />
      </div>

      {/* Content */}
      <div className="container relative z-10 pt-32 pb-20 lg:pt-40 lg:pb-24">
        <div className="max-w-3xl">
          {/* Stealth badge */}
          <div
            className={`inline-flex items-center gap-3 mb-6 transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
            }`}
            style={{ transitionDelay: "200ms" }}
          >
            <span className="inline-flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] rounded-full px-4 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              <span className="text-xs font-semibold text-amber-400/90 uppercase tracking-wider font-[Montserrat]">
                Early Access — Design Partner Cohort Open
              </span>
            </span>
          </div>

          {/* Main headline */}
          <h1
            className={`text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-[1.08] tracking-tight font-[Montserrat] mb-6 transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "400ms" }}
          >
            Building the{" "}
            <br className="hidden sm:block" />
            <span className="gradient-text">Autonomous Backbone</span>
            <br className="hidden sm:block" />
            for Enterprise.
          </h1>

          {/* Subheadline */}
          <p
            className={`text-lg lg:text-xl text-white/55 max-w-2xl leading-relaxed mb-10 transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
            }`}
            style={{ transitionDelay: "600ms" }}
          >
            AITechPros.ai is engineering a proprietary agentic orchestration layer. We are currently partnering with a select cohort of design partners to refine our core engine before a wider release.
          </p>

          {/* CTA Buttons */}
          <div
            className={`flex flex-col sm:flex-row gap-4 transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
            }`}
            style={{ transitionDelay: "800ms" }}
          >
            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="glow-btn text-white font-semibold px-8 py-4 rounded-lg text-base animate-pulse-glow inline-flex items-center justify-center gap-2 group"
            >
              Apply for Design Partnership
              <svg
                className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <a
              href="#tech-edge"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector("#tech-edge")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="glass-card text-white/80 hover:text-white font-medium px-8 py-4 rounded-lg text-base inline-flex items-center justify-center gap-2 transition-all duration-300"
            >
              View Our Technical Thesis
            </a>
          </div>

          {/* Credibility signals */}
          <div
            className={`flex flex-wrap gap-8 lg:gap-12 mt-12 pt-8 border-t border-white/[0.06] transition-all duration-1000 ${
              visible ? "opacity-100" : "opacity-0"
            }`}
            style={{ transitionDelay: "1200ms" }}
          >
            {[
              { value: "1", label: "Live Product on Google Cloud" },
              { value: "6+", label: "Google Cloud Services in Production" },
              { value: "2026", label: "Platform GA Target" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl lg:text-3xl font-bold gradient-text font-[Montserrat]">
                  {stat.value}
                </div>
                <div className="text-sm text-white/40 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom gradient fade into next section */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0B0D17] to-transparent" />
    </section>
  );
}
