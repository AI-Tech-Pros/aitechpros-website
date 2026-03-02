/*
 * Design: Quantum Glass — Luminous Glassmorphism
 * Footer: Professional dark footer — enterprise positioning
 * Includes: Privacy Policy, Terms of Service, physical address, social links
 * Google for Startups compliance: data privacy links + business address
 */
import { Link } from "wouter";
import { toast } from "sonner";
import { MapPin, Mail } from "lucide-react";

const footerLinks = {
  Platform: [
    { label: "Design Partner Program", href: "#partners" },
    { label: "Technical Thesis", href: "#tech-edge" },
    { label: "Product Roadmap", href: "#roadmap" },
  ],
  Company: [
    { label: "Founders", href: "#founders" },
    { label: "Apply for Partnership", href: "#contact" },
    { label: "Newsletter", href: "#contact" },
  ],
  Resources: [
    { label: "Engineering Blog", href: "#" },
    { label: "Documentation", href: "#" },
    { label: "API Reference", href: "#" },
  ],
};

const socialLinks = [
  {
    label: "LinkedIn",
    icon: "L",
    href: "https://www.linkedin.com/company/ai-tech-pros",
  },
  {
    label: "X",
    icon: "X",
    href: "https://x.com/AITechProsAI",
  },
  {
    label: "GitHub",
    icon: "G",
    href: "https://github.com/AI-Tech-Pros",
  },
];

const comingSoon = () => toast.info("Coming soon — stay tuned!");

export default function Footer() {
  const handleClick = (href: string) => {
    if (href === "#") {
      comingSoon();
      return;
    }
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleSocialClick = (href: string) => {
    if (href === "#") {
      comingSoon();
      return;
    }
    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <footer className="relative bg-[#080A12] border-t border-white/[0.04]">
      <div className="container py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#06B6D4] flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="text-white font-bold text-sm font-[Montserrat]">AI</span>
              </div>
              <span className="text-white font-bold text-lg tracking-tight font-[Montserrat]">
                TechPros<span className="text-[#3B82F6]">.ai</span>
              </span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed max-w-sm mb-5">
              Engineering the autonomous backbone for enterprise. A proprietary agentic orchestration layer built in partnership with the world's most ambitious organizations.
            </p>

            {/* Physical Address */}
            <div className="flex items-start gap-2 mb-2">
              <MapPin className="w-4 h-4 text-white/30 mt-0.5 shrink-0" />
              <p className="text-white/35 text-xs leading-relaxed">
                217 Davis Road<br />
                Augusta, GA 30907<br />
                United States
              </p>
            </div>
            <div className="flex items-center gap-2 mb-6">
              <Mail className="w-4 h-4 text-white/30 shrink-0" />
              <a
                href="mailto:admin@aitechpros.ai"
                className="text-white/35 text-xs hover:text-white/60 transition-colors"
              >
                admin@aitechpros.ai
              </a>
            </div>

            {/* Social links */}
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <button
                  key={social.label}
                  onClick={() => handleSocialClick(social.href)}
                  title={social.label}
                  className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/40 hover:text-white hover:border-[#3B82F6]/30 transition-all duration-300 text-xs font-medium"
                >
                  {social.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-white font-[Montserrat] mb-4">
                {title}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => handleClick(link.href)}
                      className="text-sm text-white/40 hover:text-white/70 transition-colors duration-300"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-8 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} AI Tech Pros, Inc. All rights reserved. Veteran-Owned Business.
          </p>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="text-xs text-white/30 hover:text-white/50 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-xs text-white/30 hover:text-white/50 transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
