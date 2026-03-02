/*
 * Design: Quantum Glass — Luminous Glassmorphism
 * Navbar: Sticky glassmorphism header — stealth-mode venture positioning
 * Live indicator: Pulsing green dot next to logo for agility
 * Nav: Design Partners, Technical Edge, Roadmap, Founders, Contact
 */
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Home", href: "#top" },
  { label: "Design Partners", href: "#partners" },
  { label: "Technical Edge", href: "#tech-edge" },
  { label: "Roadmap", href: "#roadmap" },
  { label: "Founders", href: "#founders" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    if (href === "#top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#0B0D17]/80 backdrop-blur-xl border-b border-white/[0.06] shadow-lg shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <nav className="container flex items-center justify-between h-18 lg:h-20">
        {/* Logo with Live indicator */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center gap-2 group"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#06B6D4] flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow duration-300">
            <span className="text-white font-bold text-sm font-[Montserrat]">AI</span>
          </div>
          <span className="text-white font-bold text-lg tracking-tight font-[Montserrat]">
            TechPros<span className="text-[#3B82F6]">.ai</span>
          </span>
          {/* Live status indicator */}
          <span className="relative flex items-center gap-1.5 ml-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider hidden sm:inline">
              Live
            </span>
          </span>
        </a>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => handleNavClick(link.href)}
              className="text-sm text-white/70 hover:text-white transition-colors duration-300 relative group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] group-hover:w-full transition-all duration-300" />
            </button>
          ))}
          <button
            onClick={() => handleNavClick("#contact")}
            className="glow-btn text-white text-sm font-semibold px-5 py-2.5 rounded-lg animate-pulse-glow"
          >
            Apply for Partnership
          </button>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden text-white/80 hover:text-white transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-400 ${
          mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-[#0B0D17]/95 backdrop-blur-xl border-t border-white/[0.06] px-4 pb-6 pt-2">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => handleNavClick(link.href)}
              className="block w-full text-left text-white/70 hover:text-white py-3 text-base transition-colors border-b border-white/[0.04] last:border-0"
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => handleNavClick("#contact")}
            className="glow-btn text-white text-sm font-semibold px-5 py-2.5 rounded-lg mt-4 w-full"
          >
            Apply for Partnership
          </button>
        </div>
      </div>
    </header>
  );
}
