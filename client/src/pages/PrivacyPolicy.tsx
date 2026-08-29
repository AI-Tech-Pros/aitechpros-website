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
        description="How AI Tech Pros, Inc. and MedStore Inc. collect, use, and protect information across our websites and services."
        path="/privacy"
      />
      <main className="subpage">
        <header className="subpage-hero">
          <p className="eyebrow">Legal</p>
          <h1>Privacy Policy</h1>
          <p>Last updated: August 29, 2026</p>
        </header>

        <Section title="1. Who we are">
          <p>
            {LEGAL_NAME} (&quot;AI Tech Pros,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is the parent company. We acquired MedStore Inc. Officers are the same as on MedStore Inc.: Nehemiah Harvard, CEO, and Henry Jenkins, CTO. This policy applies to aitechpros-website.pages.dev, orchestrateos.pages.dev, medstoreinc.com, negotiatemedicalbill.ai, and related services we operate.
          </p>
        </Section>

        <Section title="2. Information we collect">
          <p>We may collect:</p>
          <ul>
            <li>Contact details you submit (name, email, phone, company, role, message).</li>
            <li>Booking details when you use Calendly or similar scheduling tools.</li>
            <li>Account credentials if you use OrchestrateOS, partner, or educator tools.</li>
            <li>Device and usage data (pages, referrers, approximate location from IP) on our sites.</li>
            <li>For healthcare products (MedStore Inc. and Negotiate Medical Bill): information you or a covered entity provide, which may include health information governed by HIPAA and a separate business associate or product notice.</li>
          </ul>
        </Section>

        <Section title="3. Education and marketing consent">
          <p>
            Jenkins Cyber Academy and related Security+ practice are designed so study, reports, and help work without joining a community and without marketing consent. Viewing a report, clicking an optional community link, or requesting support is not marketing consent. Optional email topics are unchecked by default. We do not attach exam scores, answers, or support content to referral links or routine analytics.
          </p>
        </Section>

        <Section title="4. How we use information">
          <ul>
            <li>To operate websites, products, and customer support.</li>
            <li>To schedule conversations and fulfill educator or healthcare engagements.</li>
            <li>To protect systems, prevent abuse, and meet legal obligations.</li>
            <li>To send operational messages (security, booking, account).</li>
            <li>To send marketing only where you opted in.</li>
          </ul>
          <p>We do not sell personal information. We do not use customer content to train general-purpose models without explicit consent.</p>
        </Section>

        <Section title="5. Sharing">
          <p>We share information with service providers (hosting, email, payments such as Stripe, scheduling), with your organization if you use a team product, and when required by law. Healthcare data follows HIPAA and product-specific agreements.</p>
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
