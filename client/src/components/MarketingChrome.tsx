import { useState, type ReactNode } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import {
  ADDRESS_MAILING,
  ADDRESS_OPERATING,
  CEO,
  CONVERSATION_PATH,
  CTO,
  EMAIL_ADMIN,
  EMAIL_LEGAL,
  formatAddress,
  GITHUB_URL,
  LEGAL_NAME,
  LINKEDIN_URL,
  PHONE,
  PHONE_HREF,
} from "@/lib/company";

const navLinks = [
  { label: "Capabilities", href: "/#capabilities" },
  { label: "Ventures", href: "/projects" },
  { label: "Academy", href: "/academy" },
  { label: "Leadership", href: "/about" },
];

type MarketingChromeProps = {
  children: ReactNode;
};

export default function MarketingChrome({ children }: MarketingChromeProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="site-shell" data-rev="2">
      <div className="atelier-grain" aria-hidden="true" />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="site-masthead">
        <div className="atelier-accent" aria-hidden="true" />
        <header className="site-header">
          <a className="brand" href="/" aria-label="AI Tech Pros home">
            <img
              className="brand-logo"
              src="/assets/creative/ai-tech-pros-logo-signal-bridge.svg"
              alt="AI Tech Pros — AI systems that work."
            />
          </a>

          <button
            className="mobile-menu"
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="primary-navigation"
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            <span className="sr-only">Toggle navigation</span>
          </button>

          <nav
            id="primary-navigation"
            className={`primary-navigation ${mobileOpen ? "is-open" : ""}`}
            aria-label="Primary navigation"
          >
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                {link.label}
              </a>
            ))}
            <a
              className="nav-cta"
              href={CONVERSATION_PATH}
              onClick={() => setMobileOpen(false)}
            >
              Start a conversation <ArrowUpRight size={16} />
            </a>
          </nav>
          <div className="nav-telemetry" aria-hidden="true">
            <span className="nav-signal">
              <i />
            </span>
            <span>SYSTEM ONLINE</span>
            <span className="nav-telemetry-line" />
          </div>
        </header>
      </div>

      {children}

      <div className="site-end">
        <footer className="site-footer">
          <div className="footer-top">
            <div className="footer-identity">
              <a className="footer-brand" href="/" aria-label="AI Tech Pros home">
                <img
                  className="footer-logo"
                  src="/assets/creative/ai-tech-pros-logo-signal-bridge.svg"
                  alt="AI Tech Pros — AI systems that work."
                />
              </a>
              <p className="footer-lede">AI systems that work.</p>
              <p className="footer-entity">
                {LEGAL_NAME} includes MedStore Inc.
              </p>
              <p className="footer-officers">
                {CEO.name}, CEO · {CTO.name}, CTO
              </p>
              <p className="footer-address">Operating: {formatAddress(ADDRESS_OPERATING)}</p>
              <p className="footer-address">Mailing: {formatAddress(ADDRESS_MAILING)}</p>
            </div>
            <div className="footer-dirs">
              <nav className="footer-col" aria-label="Contact">
                <p className="footer-label">Contact</p>
                <a href={`mailto:${EMAIL_ADMIN}`}>{EMAIL_ADMIN}</a>
                <a href={`mailto:${EMAIL_LEGAL}`}>{EMAIL_LEGAL}</a>
                <a href={PHONE_HREF}>{PHONE}</a>
              </nav>
              <nav className="footer-col" aria-label="Company">
                <p className="footer-label">Company</p>
                <a href={CONVERSATION_PATH}>Start a conversation</a>
                <a href="/about">Leadership</a>
                <a href={LINKEDIN_URL} target="_blank" rel="noreferrer">
                  LinkedIn
                </a>
                <a href={GITHUB_URL} target="_blank" rel="noreferrer">
                  GitHub
                </a>
              </nav>
              <nav className="footer-col" aria-label="Legal">
                <p className="footer-label">Legal</p>
                <a href="/privacy">Privacy</a>
                <a href="/terms">Terms</a>
              </nav>
            </div>
          </div>
          <div className="footer-rule" aria-hidden="true" />
          <p className="footer-copy">© {new Date().getFullYear()} {LEGAL_NAME}</p>
        </footer>
      </div>
    </div>
  );
}
