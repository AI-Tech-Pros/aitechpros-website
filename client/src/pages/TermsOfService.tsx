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

export default function TermsOfService() {
  return (
    <MarketingChrome>
      <PageMeta
        title="Terms of Service — AI Tech Pros"
        description="Terms for AI Tech Pros, Inc. websites and services, including MedStore Inc. after acquisition."
        path="/terms"
      />
      <main className="subpage">
        <header className="subpage-hero">
          <p className="eyebrow">Legal</p>
          <h1>Terms of Service</h1>
          <p>Last updated: August 29, 2026</p>
        </header>

        <Section title="1. Agreement">
          <p>
            By using websites or services of {LEGAL_NAME} (&quot;AI Tech Pros,&quot; &quot;we,&quot; &quot;us&quot;), including MedStore Inc. properties we operate after the acquisition, you agree to these Terms. If you use the Services for an organization, you represent that you can bind that organization.
          </p>
        </Section>

        <Section title="2. Services">
          <p>Services may include:</p>
          <ul>
            <li>Company websites and contact or scheduling tools.</li>
            <li>OrchestrateOS and related developer or partner tools.</li>
            <li>MedStore Inc. healthcare technology offerings.</li>
            <li>Negotiate Medical Bill and other AI applications we publish.</li>
            <li>Jenkins Cyber Academy information pages and optional community links.</li>
            <li>Educator backoffice services when contracted.</li>
          </ul>
        </Section>

        <Section title="3. Eligibility">
          <p>You must be at least 18 and able to form a contract. Healthcare and enterprise products may require additional agreements. Education pages do not replace professional or legal advice.</p>
        </Section>

        <Section title="4. Accounts">
          <p>If you create an account, you must provide accurate information, keep credentials confidential, and notify us of unauthorized use. You are responsible for activity under your account.</p>
        </Section>

        <Section title="5. Education and community">
          <p>
            Academy content is for learning. We do not guarantee certification results, employment, interviews, or salary. Free study materials described on this site remain available without purchasing community membership. Optional Career Ops or coaching is a separate, disclosed offer.
          </p>
        </Section>

        <Section title="6. Healthcare and AI outputs">
          <p>
            MedStore Inc. and Negotiate Medical Bill may process sensitive data under HIPAA and product terms. AI outputs are provided as-is and can be wrong. You are responsible for reviewing outputs before acting. We do not use customer data to train general-purpose models without explicit consent.
          </p>
        </Section>

        <Section title="7. Acceptable use">
          <p>You may not use the Services to violate law, infringe rights, distribute malware, probe systems without authorization, reverse engineer except as allowed by law, or submit exam-dump or stolen assessment content.</p>
        </Section>

        <Section title="8. Intellectual property">
          <p>
            We and our licensors own the Services, branding, and software. You retain rights in content you submit. You grant us a limited license to host and process that content to provide the Services. Educators using the backoffice keep their channel IP as described in their member agreement.
          </p>
        </Section>

        <Section title="9. Payment">
          <p>Paid services are billed under an order form or checkout terms. Fees are non-refundable unless that agreement says otherwise. Educator payouts, when offered, run through Stripe Connect; we are not a money transmitter.</p>
        </Section>

        <Section title="10. Disclaimers and liability">
          <p>
            THE SERVICES ARE PROVIDED &quot;AS IS.&quot; TO THE MAXIMUM EXTENT PERMITTED BY LAW, {LEGAL_NAME} IS NOT LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR LOST PROFITS, DATA, OR BUSINESS. OUR TOTAL LIABILITY FOR CLAIMS UNDER THESE TERMS WILL NOT EXCEED THE AMOUNT YOU PAID US FOR THE SERVICES IN THE TWELVE MONTHS BEFORE THE CLAIM, OR ONE HUNDRED U.S. DOLLARS IF YOU PAID NOTHING.
          </p>
        </Section>

        <Section title="11. Indemnity">
          <p>You will indemnify {LEGAL_NAME}, MedStore Inc., and our officers, including the CEO and CTO, from claims arising from your use of the Services or violation of these Terms.</p>
        </Section>

        <Section title="12. Termination">
          <p>We may suspend or terminate access for violation of these Terms or with reasonable notice. Provisions that should survive (including IP, disclaimers, and liability limits) remain in effect.</p>
        </Section>

        <Section title="13. Governing law">
          <p>
            These Terms are governed by the laws of the State of Georgia, United States, without regard to conflict-of-law rules. Courts in Augusta, Georgia have exclusive jurisdiction, except where a healthcare or enterprise agreement specifies otherwise.
          </p>
        </Section>

        <Section title="14. Changes">
          <p>We may update these Terms by posting a new version. Continued use after the update is acceptance.</p>
        </Section>

        <Section title="15. Contact">
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
