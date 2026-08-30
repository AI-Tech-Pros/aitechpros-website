import {
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleDot,
  Layers3,
  Network,
  ShieldCheck,
} from "lucide-react";
import MarketingChrome from "@/components/MarketingChrome";
import PageMeta from "@/components/PageMeta";
import VentureSpreads from "@/components/VentureSpreads";
import {
  CEO,
  CONVERSATION_PATH,
  CTO,
  EMAIL_ADMIN,
  LEGAL_NAME,
  ORCHESTRATEOS_URL,
  SKOOL_URL,
} from "@/lib/company";

const capabilities = [
  {
    number: "01",
    icon: Network,
    title: "Enterprise AI systems",
    text: "Governed, resumable agent workflows through OrchestrateOS — for teams that cannot restart a 50-step job from zero.",
    link: "Explore OrchestrateOS",
    href: ORCHESTRATEOS_URL,
    external: true,
    image: "/assets/creative/capability-enterprise-ai.webp",
    alt: "Layered modular intelligence system with connected pathways and human markers.",
  },
  {
    number: "02",
    icon: ShieldCheck,
    title: "Security with intent",
    text: "Jenkins Cyber Academy is our free live Security+ classroom. Healthcare security continues through MedStore Inc., now part of AI Tech Pros, Inc.",
    link: "Explore the academy",
    href: "/academy",
    image: "/assets/creative/capability-security.webp",
    alt: "Geometric security structure with protected pathways, checkpoints, and connected infrastructure.",
    external: false,
  },
  {
    number: "03",
    icon: Layers3,
    title: "Enablement that travels",
    text: "Certification educators keep their channels. We run distribution, sponsorship operations, and payouts as a backoffice — starting with Jenkins Cyber Academy.",
    link: "Explore the backoffice",
    href: "/backoffice",
    image: "/assets/creative/capability-enablement.webp",
    alt: "Connected learning pathway transforming expertise into a reusable system.",
    external: false,
  },
];

const principles = [
  "Governance before acceleration",
  "Useful systems over novelty",
  "Clear ownership at every layer",
];

export default function Home() {
  return (
    <MarketingChrome>
      <PageMeta
        title="AI Tech Pros — AI systems that work."
        description="AI Tech Pros, Inc. connects strategy, secure infrastructure, and human expertise. Parent of MedStore Inc., Negotiate Medical Bill, OrchestrateOS, and Jenkins Cyber Academy."
        path="/"
      />
      <main id="top">
        <section className="hero-section" aria-labelledby="hero-heading">
          <div className="hero-grid" aria-hidden="true" />
          <div className="hero-copy">
            <p className="eyebrow">
              <CircleDot size={14} /> AI systems that work.
            </p>
            <h1 id="hero-heading">
              Build what the future of work <em>needs next.</em>
            </h1>
            <p className="hero-lede">
              {LEGAL_NAME} is the parent company for leaders who need more than a promising demo. We connect strategy, secure infrastructure, and human expertise — and we now include MedStore Inc., with the same CEO and CTO.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href={CONVERSATION_PATH}>
                Start a conversation <ArrowUpRight size={17} />
              </a>
              <a className="text-link" href="#capabilities">
                See what we do <ChevronRight size={17} />
              </a>
            </div>
            <div className="hero-note">
              <span className="note-rule" />
              <span>Enterprise credibility first. Practical enablement always.</span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-signal-field" aria-hidden="true">
              <span className="hero-ring ring-one" />
              <span className="hero-ring ring-two" />
              <span className="hero-ring ring-three" />
              <span className="hero-scanline" />
              <span className="hero-node node-one" />
              <span className="hero-node node-two" />
              <span className="hero-node node-three" />
            </div>
            <img
              className="hero-art"
              src="/assets/creative/ai-tech-pros-hero-focus.webp"
              alt="Abstract connected system representing useful intelligence, secure infrastructure, and human expertise."
            />
            <div className="visual-label">
              <span>AI / SECURITY / ENABLEMENT</span>
              <small>FIELD 03 / 04</small>
            </div>
            <div className="hero-readout" aria-hidden="true">
              <span>INTELLIGENCE FIELD</span>
              <b>03.07</b>
              <i />
            </div>
            <div className="visual-caption">
              A connected operating model
              <br />
              for the work ahead.
            </div>
          </div>
        </section>

        <section className="signal-strip" aria-label="Company focus">
          <div>
            <span>01</span> Strategy <i className="signal-tick" aria-hidden="true" />
          </div>
          <div>
            <span>02</span> Systems <i className="signal-tick" aria-hidden="true" />
          </div>
          <div>
            <span>03</span> Safeguards <i className="signal-tick" aria-hidden="true" />
          </div>
          <div>
            <span>04</span> Scale <i className="signal-tick" aria-hidden="true" />
          </div>
        </section>

        <section id="capabilities" className="section capabilities-section" aria-labelledby="capabilities-heading">
          <div className="section-intro">
            <p className="eyebrow">What we bring together</p>
            <h2 id="capabilities-heading">The right mix of ambition and operational clarity.</h2>
            <p>
              Technology only creates value when it is understandable, secure, and adopted. Our work sits at the intersection of those three conditions — across enterprise AI, healthcare systems, and cybersecurity education.
            </p>
          </div>
          <div className="capability-grid">
            {capabilities.map(({ number, icon: Icon, title, text, link, href, image, alt, external }) => (
              <article className="capability-card" key={number}>
                <div className="card-image-wrap">
                  <img className="capability-image" src={image} alt={alt} loading="lazy" />
                  <div className="card-topline">
                    <span>{number}</span>
                    <Icon size={22} strokeWidth={1.5} />
                  </div>
                  <div className="card-scanline" aria-hidden="true" />
                </div>
                <div className="module-meta">
                  <span>MODULE {number}</span>
                  <i aria-hidden="true" />
                  <span>READY</span>
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
                <a
                  className="card-link"
                  href={href}
                  {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
                >
                  {link} <ArrowUpRight size={15} />
                </a>
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
            <p className="approach-lede">
              The strongest AI initiatives are not the loudest. They are the ones people can understand, govern, and rely on when the stakes are real.
            </p>
            <div className="principles-list">
              {principles.map((principle) => (
                <div className="principle" key={principle}>
                  <Check size={17} /> <span>{principle}</span>
                </div>
              ))}
            </div>
            <a className="button button-light" href={CONVERSATION_PATH}>
              Talk through your next system <ArrowUpRight size={17} />
            </a>
          </div>
          <div className="approach-diagram">
            <div className="diagram-frame">
              <img
                src="/assets/creative/operating-principles.svg"
                alt="Operating model diagram connecting govern, guide, connect, and scale around useful intelligence."
                loading="lazy"
              />
              <span className="diagram-pulse pulse-one" aria-hidden="true" />
              <span className="diagram-pulse pulse-two" aria-hidden="true" />
              <div className="diagram-readout" aria-hidden="true">
                <span>GOVERNANCE LATTICE</span>
                <b>ACTIVE / 04 NODES</b>
              </div>
            </div>
          </div>
        </section>

        <section id="ventures" className="section ventures-section" aria-labelledby="ventures-heading">
          <div className="section-intro">
            <p className="eyebrow">The same ventures as henryljenkins.com</p>
            <h2 id="ventures-heading">Three live companies. One parent.</h2>
            <p>
              These are the public projects listed on Henry L. Jenkins&apos; site. {LEGAL_NAME} is the parent. MedStore Inc. is now part of that parent, with unchanged executive leadership.
            </p>
          </div>
          <div className="venture-spreads-wrap">
            <VentureSpreads />
          </div>
        </section>

        <section id="leadership" className="section leadership-section" aria-labelledby="leadership-heading">
          <div className="section-intro">
            <p className="eyebrow">Leadership</p>
            <h2 id="leadership-heading">The same officers as MedStore Inc.</h2>
            <p>
              After the acquisition, {CEO.name} remains CEO and {CTO.name} remains CTO. Advisors continue from the MedStore Inc. board.
            </p>
          </div>
          <div className="people-grid people-grid--officers">
            <article className="person-card person-card--portrait">
              <div className="person-portrait">
                <img src={CEO.photo} alt={`${CEO.name}, ${CEO.title}`} width={300} height={300} decoding="async" loading="lazy" />
              </div>
              <div className="person-body">
                <p className="person-role">{CEO.title}</p>
                <h3>{CEO.name}</h3>
                <p>{CEO.service}</p>
              </div>
            </article>
            <article className="person-card person-card--portrait">
              <div className="person-portrait">
                <img src={CTO.photo} alt={`${CTO.name}, ${CTO.title}`} width={300} height={300} decoding="async" loading="lazy" />
              </div>
              <div className="person-body">
                <p className="person-role">{CTO.title}</p>
                <h3>{CTO.name}</h3>
                <p>{CTO.service}</p>
              </div>
            </article>
          </div>
          <a className="text-link" href="/about">
            Full leadership and advisors <ChevronRight size={17} />
          </a>
        </section>

        <section id="orchestrateos" className="section product-section" aria-labelledby="product-heading">
          <div className="product-kicker">
            <span className="product-dot" /> A product by AI Tech Pros{" "}
            <span className="product-status">
              <i /> RESUMABLE / GOVERNED
            </span>
          </div>
          <div className="product-layout">
            <div>
              <h2 id="product-heading">When workflows need to keep their promises.</h2>
              <p>
                OrchestrateOS is our governance-first runtime for durable, resumable AI workflows. It is a focused product for teams building systems where progress, approvals, and accountability matter.
              </p>
            </div>
            <div className="product-visual-wrap">
              <img
                className="product-visual"
                src="/assets/creative/orchestrateos-bridge.webp"
                alt="Conceptual workflow spine with checkpoints, approval gates, and resumable pathways."
                loading="lazy"
              />
              <div className="product-telemetry" aria-hidden="true">
                <span>WORKFLOW TELEMETRY</span>
                <i />
                <b>07 / 12</b>
              </div>
            </div>
            <a className="button button-outline" href={ORCHESTRATEOS_URL} target="_blank" rel="noreferrer">
              Visit OrchestrateOS <ArrowUpRight size={17} />
            </a>
          </div>
        </section>

        <section className="closing-section" aria-labelledby="closing-heading">
          <div className="closing-signal" aria-hidden="true">
            <span />
            <i />
            <b />
          </div>
          <p className="eyebrow">The next useful thing</p>
          <h2 id="closing-heading">Bring us the hard part.</h2>
          <p>We will help you turn it into a system people can trust.</p>
          <div className="hero-actions hero-actions-center">
            <a className="button button-primary" href={CONVERSATION_PATH}>
              Book a conversation <ArrowUpRight size={17} />
            </a>
            <a className="text-link" href={`mailto:${EMAIL_ADMIN}`}>
              Write {EMAIL_ADMIN}
            </a>
            <a className="text-link" href={SKOOL_URL} target="_blank" rel="noreferrer">
              Join the free study community <ChevronRight size={17} />
            </a>
          </div>
        </section>
      </main>
    </MarketingChrome>
  );
}
