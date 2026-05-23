/*
 * Design: Quantum Glass — Luminous Glassmorphism
 * Hero: Stealth-mode venture positioning — autonomous backbone for enterprise
 * Background: Static neural network image + animated canvas overlay (flow + sparkle)
 * Tone: Ambitious, selective, investor-grade
 */
import { useEffect, useState } from "react";
import NeuralNetworkCanvas from "./NeuralNetworkCanvas";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663028368274/RDzc8Kay9NxmabXz39Hgzg/neural-network-hero_5b8079da.png";
const trustedLogos = [
  {
    name: "Department of Defense",
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_the_United_States_Department_of_Defense.svg",
  },
  {
    name: "Department of Homeland Security",
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_the_United_States_Department_of_Homeland_Security.svg",
  },
  {
    name: "Department of the Treasury",
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_the_United_States_Department_of_the_Treasury.svg",
  },
  {
    name: "Denton Law Firm",
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Dentons_logo.svg",
  },
  {
    name: "Frontline Managed Services",
    src: "https://logo.clearbit.com/frontlinems.com",
  },
  {
    name: "US Army",
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Logo_of_the_United_States_Army_2023.svg",
  },
  {
    name: "Blue Cross Blue Shield",
    src: "https://logo.clearbit.com/bcbs.com",
  },
  {
    name: "Georgia Pacific",
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Georgia-Pacific_symbol.svg",
  },
];

export default function HeroSection() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative overflow-hidden min-h-[92vh]">
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
      <div className="container relative z-10 pt-24 pb-16 sm:pt-28 sm:pb-20 lg:pt-32 lg:pb-24">
        <div className="max-w-5xl">
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
                Enterprise Runtime Engine
              </span>
            </span>
          </div>

          {/* Main headline */}
          <h1
            className={`text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-[1.08] tracking-tight font-[Montserrat] mb-5 transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "400ms" }}
          >
            The <span className="gradient-text">Hardened Runtime Engine</span>
            <br className="hidden sm:block" />
            for Autonomous Enterprise Workflows
          </h1>

          {/* Subheadline */}
          <p
            className={`text-lg lg:text-xl text-white/55 max-w-3xl leading-relaxed mb-7 transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
            }`}
            style={{ transitionDelay: "600ms" }}
          >
            Stop chasing AI hype. Build secure, deterministic, high-yield automation that bridges your legacy infrastructure and modern LLMs.
          </p>
          <p
            className={`text-sm sm:text-base text-white/70 max-w-2xl mb-8 transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: "700ms" }}
          >
            For CIOs, CTOs, and CISOs operating in regulated, high-stakes environments.
          </p>

          {/* CTA Buttons */}
          <div
            className={`flex flex-col sm:flex-row gap-4 transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
            }`}
            style={{ transitionDelay: "800ms" }}
          >
            <a
              href="https://calendly.com/aitechpros/15min"
              target="_blank"
              rel="noopener noreferrer"
              className="glow-btn text-white font-semibold px-8 py-4 rounded-lg text-base animate-pulse-glow inline-flex items-center justify-center gap-2 group"
            >
              Schedule a Strategy Call
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
              View Runtime Architecture
            </a>
          </div>

          {/* Trusted-by social proof */}
          <div
            className={`mt-11 pt-8 border-t border-white/[0.08] transition-all duration-1000 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
            style={{ transitionDelay: "1200ms" }}
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <p className="text-xs text-white/45 uppercase tracking-[0.22em] font-[Montserrat]">
                Trusted by
              </p>
              <p className="text-xs text-white/35">Federal and enterprise operators</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {trustedLogos.map((logo) => (
                <div key={logo.name} className="glass-card rounded-xl p-3 sm:p-4 flex items-center justify-center min-h-20">
                  <img
                    src={logo.src}
                    alt={logo.name}
                    loading="lazy"
                    className="max-h-10 sm:max-h-12 w-auto max-w-full object-contain grayscale contrast-125 brightness-95 opacity-90"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade into next section */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0B0D17] to-transparent" />
    </section>
  );
}
