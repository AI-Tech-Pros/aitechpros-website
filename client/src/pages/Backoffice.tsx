import { ArrowUpRight } from "lucide-react";
import MarketingChrome from "@/components/MarketingChrome";
import PageMeta from "@/components/PageMeta";
import { CALENDLY_URL, LEGAL_NAME } from "@/lib/company";

export default function Backoffice() {
  return (
    <MarketingChrome>
      <PageMeta
        title="Educator backoffice — AI Tech Pros"
        description="AI Tech Pros Backoffice helps certification educators keep their channels while the network runs distribution, sponsorship operations, and payouts. Member zero: Jenkins Cyber Academy."
        path="/backoffice"
      />
      <main className="subpage">
        <header className="subpage-hero">
          <p className="eyebrow">Educator backoffice</p>
          <h1>Keep the classroom. We run the secondary work.</h1>
          <p>
            {LEGAL_NAME} is building a multi-tenant backoffice for certification and career educators: clip distribution, sponsorship tracking, and payouts. Educators keep their content, channels, and audiences. We do not take equity, IP, or platform ad revenue. Member zero is Jenkins Cyber Academy.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href={CALENDLY_URL} target="_blank" rel="noreferrer">
              Talk with the network <ArrowUpRight size={17} />
            </a>
            <a className="text-link" href="/academy">
              See the academy (learner path)
            </a>
          </div>
        </header>

        <section className="prose-light">
          <h2>What this is</h2>
          <p>
            A service layer powered by OrchestrateOS: VOD-to-clips, sponsorship CRM, Stripe Connect payouts, and operator review. Brands book through a public storefront later. Funds never sit in our own accounts.
          </p>
          <h2>What this is not</h2>
          <ul>
            <li>Not a streaming tool — educators keep OBS, Twitch, YouTube, and Kick.</li>
            <li>Not an MCN — no exclusivity and no cut of platform ads.</li>
            <li>Not a course platform — community stays on Skool.</li>
            <li>Not a live product login yet. Phase 0 (through 21 November 2026) is a manual backoffice while we log every repetitive task as a requirement. A founding cohort of 3 to 5 educators is planned for Q1 2027.</li>
          </ul>
        </section>
      </main>
    </MarketingChrome>
  );
}
