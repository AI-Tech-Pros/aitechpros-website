/*
 * OrchestrateOS product navbar — subdomain landing page header
 */
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { mainSiteUrl, orchestrateOSApiDocsUrl } from "@/lib/site";

const navLinks = [
  { label: "Problem", href: "#problem" },
  { label: "Primitives", href: "#primitives" },
  { label: "Gates", href: "#gates" },
  { label: "API", href: "#api" },
  { label: "Benchmark", href: "#benchmark" },
];

const CALENDLY_URL = "https://calendly.com/aitechpros/15min";

export default function OrchestrateOSNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#0B0D17]/85 backdrop-blur-xl border-b border-white/[0.06] shadow-lg shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <div className="container flex items-center justify-between h-16 lg:h-[4.5rem]">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#06B6D4] flex items-center justify-center shadow-lg shadow-violet-500/20">
            <span className="text-white font-bold text-xs font-[Montserrat]">OS</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-white font-bold text-base tracking-tight font-[Montserrat]">
              Orchestrate<span className="text-[#8B5CF6]">OS</span>
            </span>
            <span className="text-[10px] text-white/35 tracking-wider uppercase">
              by AI Tech Pros
            </span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollTo(link.href)}
              className="text-sm text-white/55 hover:text-white transition-colors font-medium"
            >
              {link.label}
            </button>
          ))}
          <a
            href={orchestrateOSApiDocsUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#06B6D4]/80 hover:text-[#06B6D4] transition-colors inline-flex items-center gap-1 font-mono text-xs"
          >
            API
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
          <a
            href={mainSiteUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-white/40 hover:text-white/70 transition-colors inline-flex items-center gap-1"
          >
            {new URL(mainSiteUrl()).hostname}
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white text-sm font-semibold font-[Montserrat] hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/20"
          >
            Request Access
          </a>
        </nav>

        <button
          className="lg:hidden text-white/70 p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-[#0B0D17]/95 backdrop-blur-xl border-b border-white/[0.06] px-6 py-4 space-y-3">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollTo(link.href)}
              className="block w-full text-left text-sm text-white/70 py-2"
            >
              {link.label}
            </button>
          ))}
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center px-5 py-3 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white text-sm font-semibold"
          >
            Request Access
          </a>
        </div>
      )}
    </header>
  );
}
