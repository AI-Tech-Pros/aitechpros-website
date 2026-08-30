import type { ReactNode } from "react";
import MarketingChrome from "@/components/MarketingChrome";
import PageMeta from "@/components/PageMeta";
import {
  ADDRESS_MAILING,
  ADDRESS_OPERATING,
  EMAIL_LEGAL,
  formatAddress,
  LEGAL_NAME,
  PHONE,
  PHONE_HREF,
} from "@/lib/company";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="legal-block">
      <h2>{title}</h2>
      <div className="prose-light">{children}</div>
    </section>
  );
}

export default function PrivacyPolicy() {
  return (
    <MarketingChrome>
      <PageMeta
        title="Privacy Policy — AI Tech Pros"
        description="How AI Tech Pros, Inc. collects and uses information on this marketing website and conversation page."
        path="/privacy"
      />
      <main id="main" className="subpage legal-page">
        <header className="subpage-hero">
          <p className="eyebrow">Legal</p>
          <h1>Privacy Policy</h1>
          <p>Last updated: August 30, 2026</p>
        </header>

        <Section title="1. Who we are">
          <p>
            {LEGAL_NAME} (&quot;AI Tech Pros,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is a Georgia corporation and the parent company of MedStore Inc. Officers are Nehemiah Harvard, CEO, and Henry Jenkins, CTO. This policy applies to this marketing website at aitechpros.ai, including the conversation page.
          </p>
          <p>
            OrchestrateOS, medstoreinc.com, negotiatemedicalbill.ai, and the Henry Jenkins Mentorship community are separate properties and may publish their own notices. This page does not replace those notices.
          </p>
        </Section>

        <Section title="2. Information we collect">
          <p>On this website we may collect:</p>
          <ul>
            <li>Contact details you send by email or phone (name, email, phone, company, message).</li>
            <li>Scheduling details when you book through the Calendly embed on this site.</li>
            <li>Technical logs from our host (pages requested, referrer, user agent, and approximate location from IP).</li>
          </ul>
          <p>
            This marketing site does not offer a customer login, a Design Partner application, or a cookie consent banner. Calendly may set its own cookies when you use the scheduler.
          </p>
        </Section>

        <Section title="3. Education and marketing consent">
          <p>
            Jenkins Cyber Academy and related Security+ practice — on academy pages and in the Henry Jenkins Mentorship community — are designed so study, reports, and help work without joining a paid community and without marketing consent. Viewing a report, clicking an optional community link, or requesting support is not marketing consent. Optional email topics are unchecked by default. This marketing site does not collect exam scores.
          </p>
        </Section>

        <Section title="4. How we use information">
          <ul>
            <li>To operate this website and respond to conversations you start.</li>
            <li>To schedule meetings you request through Calendly.</li>
            <li>To protect the site, prevent abuse, and meet legal obligations.</li>
            <li>To send operational messages about a booking you made.</li>
            <li>To send marketing only where you opted in. We do not run a newsletter signup on this site today.</li>
          </ul>
          <p>We do not sell personal information. We do not use messages you send through this site to train general-purpose models.</p>
        </Section>

        <Section title="5. Sharing">
          <p>
            We share information with service providers that run this site and booking (including Cloudflare and Calendly), and when required by law. Healthcare products and OrchestrateOS accounts are not created on this marketing site; those products follow their own agreements.
          </p>
        </Section>

        <Section title="6. Retention and security">
          <p>We retain information as needed for the purpose collected, legal holds, and security. We use administrative, technical, and physical safeguards appropriate to the data, including encryption in transit on our production sites.</p>
        </Section>

        <Section title="7. Your rights">
          <p>
            Depending on your location (including CCPA and GDPR where they apply), you may request access, correction, deletion, or a copy of personal information, and you may opt out of marketing. Contact us using the details below. You will not be required to join a paid community to exercise these rights.
          </p>
        </Section>

        <Section title="8. Contact">
          <p>
            {LEGAL_NAME}
            <br />
            Operating: {formatAddress(ADDRESS_OPERATING)}
            <br />
            Mailing (MedStore Inc.): {formatAddress(ADDRESS_MAILING)}
            <br />
            Email: <a href={`mailto:${EMAIL_LEGAL}`}>{EMAIL_LEGAL}</a>
            <br />
            Phone: <a href={PHONE_HREF}>{PHONE}</a>
          </p>
        </Section>
      </main>
    </MarketingChrome>
  );
}
