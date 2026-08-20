import {
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleDot,
  Layers3,
  Menu,
  Network,
  ShieldCheck,
  X,
} from "lucide-react";
import { useState } from "react";

const capabilities = [
  {
    number: "01",
    icon: Network,
    title: "Enterprise AI systems",
    text: "We help teams move from isolated experiments to useful, governed systems that fit the way people actually work.",
    link: "Explore enterprise AI",
    image: "/assets/creative/capability-enterprise-ai.webp",
    alt: "Layered modular intelligence system with connected pathways and human markers.",
  },
  {
    number: "02",
    icon: ShieldCheck,
    title: "Security with intent",
    text: "Security is designed into the operating model—clear ownership, durable controls, and visibility without unnecessary friction.",
    link: "Explore cybersecurity",
    image: "/assets/creative/capability-security.webp",
    alt: "Geometric security structure with protected pathways, checkpoints, and connected infrastructure.",
  },
  {
    number: "03",
    icon: Layers3,
    title: "Enablement that travels",
    text: "From educators to creator-operators, we turn expertise into repeatable systems, content, and outcomes that can scale.",
    link: "Explore enablement",
    image: "/assets/creative/capability-enablement.webp",
    alt: "Connected learning pathway transforming expertise into a reusable system.",
  },
];

const principles = [
  "Governance before acceleration",
  "Useful systems over novelty",
  "Clear ownership at every layer",
];

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="AI Tech Pros home">
          <img className="brand-logo" src="/assets/creative/ai-tech-pros-logo.svg" alt="AI Tech Pros — Systems for Useful Intelligence" />
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
          <a href="#capabilities" onClick={() => setMobileOpen(false)}>Capabilities</a>
          <a href="#approach" onClick={() => setMobileOpen(false)}>Our approach</a>
          <a href="#orchestrateos" onClick={() => setMobileOpen(false)}>OrchestrateOS</a>
          <a className="nav-cta" href="https://calendly.com/aitechpros/15min" target="_blank" rel="noreferrer">
            Start a conversation <ArrowUpRight size={16} />
          </a>
        </nav>
      </header>

      <main id="top">
        <section className="hero-section" aria-labelledby="hero-heading">
          <div className="hero-grid" aria-hidden="true" />
          <div className="hero-copy">
            <p className="eyebrow"><CircleDot size={14} /> AI systems, made useful</p>
            <h1 id="hero-heading">Build what the future of work <em>needs next.</em></h1>
            <p className="hero-lede">
              AI Tech Pros is a technology company for leaders who need more than a promising demo. We connect strategy, secure infrastructure, and human expertise to make intelligent systems dependable in the real world.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="https://calendly.com/aitechpros/15min" target="_blank" rel="noreferrer">
                Start a conversation <ArrowUpRight size={17} />
              </a>
              <a className="text-link" href="#capabilities">See what we do <ChevronRight size={17} /></a>
            </div>
            <div className="hero-note">
              <span className="note-rule" />
              <span>Enterprise credibility first. Practical enablement always.</span>
            </div>
          </div>
          <div className="hero-visual">
            <img className="hero-art" src="/assets/creative/ai-tech-pros-hero-focus.webp" alt="Abstract connected system representing useful intelligence, secure infrastructure, and human expertise." />
            <div className="visual-label">AI / SECURITY / ENABLEMENT</div>
            <div className="visual-caption">A connected operating model<br />for the work ahead.</div>
          </div>
        </section>

        <section className="signal-strip" aria-label="Company focus">
          <div><span>01</span> Strategy</div>
          <div><span>02</span> Systems</div>
          <div><span>03</span> Safeguards</div>
          <div><span>04</span> Scale</div>
        </section>

        <section id="capabilities" className="section capabilities-section" aria-labelledby="capabilities-heading">
          <div className="section-intro">
            <p className="eyebrow">What we bring together</p>
            <h2 id="capabilities-heading">The right mix of ambition and operational clarity.</h2>
            <p>Technology only creates value when it is understandable, secure, and adopted. Our work sits at the intersection of those three conditions.</p>
          </div>
          <div className="capability-grid">
            {capabilities.map(({ number, icon: Icon, title, text, link, image, alt }) => (
              <article className="capability-card" key={number}>
                <div className="card-image-wrap"><img className="capability-image" src={image} alt={alt} loading="lazy" /><div className="card-topline"><span>{number}</span><Icon size={22} strokeWidth={1.5} /></div></div>
                <h3>{title}</h3>
                <p>{text}</p>
                <a className="card-link" href="#approach">{link} <ArrowUpRight size={15} /></a>
              </article>
            ))}
          </div>
        </section>

        <section id="approach" className="approach-section" aria-labelledby="approach-heading">
          <div className="approach-aside">
            <p className="eyebrow">Our operating principle</p>
            <div className="approach-index">/ 04</div>
          </div>
          <div className="approach-content">
            <h2 id="approach-heading">Trust is not a feature. It is the system.</h2>
            <p className="approach-lede">The strongest AI initiatives are not the loudest. They are the ones people can understand, govern, and rely on when the stakes are real.</p>
            <div className="principles-list">
              {principles.map((principle) => (
                <div className="principle" key={principle}><Check size={17} /> <span>{principle}</span></div>
              ))}
            </div>
            <a className="button button-light" href="https://calendly.com/aitechpros/15min" target="_blank" rel="noreferrer">Talk through your next system <ArrowUpRight size={17} /></a>
          </div>
          <div className="approach-diagram">
            <img src="/assets/creative/operating-principles.svg" alt="Operating model diagram connecting govern, guide, connect, and scale around useful intelligence." loading="lazy" />
          </div>
        </section>

        <section id="orchestrateos" className="section product-section" aria-labelledby="product-heading">
          <div className="product-kicker"><span className="product-dot" /> A product by AI Tech Pros</div>
          <div className="product-layout">
            <div>
              <h2 id="product-heading">When workflows need to keep their promises.</h2>
              <p>OrchestrateOS is our governance-first runtime for durable, resumable AI workflows. It is a focused product for teams building systems where progress, approvals, and accountability matter.</p>
            </div>
            <div className="product-visual-wrap"><img className="product-visual" src="/assets/creative/orchestrateos-bridge.webp" alt="Conceptual workflow spine with checkpoints, approval gates, and resumable pathways." loading="lazy" /></div>
            <a className="button button-outline" href="https://orchestrateos.pages.dev" target="_blank" rel="noreferrer">Visit OrchestrateOS <ArrowUpRight size={17} /></a>
          </div>
        </section>

        <section className="closing-section" aria-labelledby="closing-heading">
          <p className="eyebrow">The next useful thing</p>
          <h2 id="closing-heading">Bring us the hard part.</h2>
          <p>We will help you turn it into a system people can trust.</p>
          <a className="button button-primary" href="https://calendly.com/aitechpros/15min" target="_blank" rel="noreferrer">Book a conversation <ArrowUpRight size={17} /></a>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-brand"><img className="footer-logo" src="/assets/creative/ai-tech-pros-logo.svg" alt="AI Tech Pros — Systems for Useful Intelligence" /></div>
        <p>AI systems for the work ahead.</p>
        <div className="footer-links"><a href="https://www.linkedin.com/company/ai-tech-pros" target="_blank" rel="noreferrer">LinkedIn</a><a href="https://github.com/AI-Tech-Pros" target="_blank" rel="noreferrer">GitHub</a><a href="/privacy">Privacy</a></div>
        <small>© 2026 AI Tech Pros LLC.</small>
      </footer>
    </div>
  );
}
