/*
 * Design: Quantum Glass — Luminous Glassmorphism
 * Privacy Policy: CCPA/GDPR-ready policy for AI enterprise company
 * Demonstrates data privacy compliance — critical for Google for Startups AI tier
 */
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#0B0D17]">
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="container max-w-4xl">
          <div className="mb-12">
            <span className="text-sm font-medium text-[#06B6D4] tracking-widest uppercase font-[Montserrat] mb-4 block">
              Legal
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-[Montserrat] mb-4">
              Privacy <span className="gradient-text">Policy</span>
            </h1>
            <p className="text-white/40 text-sm">
              Last updated: March 1, 2026
            </p>
          </div>

          <div className="prose-policy space-y-8">
            <Section title="1. Introduction">
              <p>
                AI Tech Pros, Inc. ("AITechPros," "we," "us," or "our") is committed to protecting the privacy and security of your personal information. This Privacy Policy describes how we collect, use, disclose, and safeguard information when you visit our website at aitechpros.ai, use our services, or interact with our agentic AI orchestration platform.
              </p>
              <p>
                As an AI-first enterprise technology company, we understand the critical importance of data privacy and security. We are committed to compliance with applicable data protection laws, including the California Consumer Privacy Act (CCPA), the General Data Protection Regulation (GDPR), and other relevant regulations.
              </p>
            </Section>

            <Section title="2. Information We Collect">
              <p>We may collect the following categories of information:</p>
              <h4 className="text-white/80 font-semibold mt-4 mb-2 font-[Montserrat]">2.1 Information You Provide</h4>
              <ul>
                <li>Contact information (name, email address, phone number, company name)</li>
                <li>Business information submitted through our Design Partner application</li>
                <li>Communications and correspondence with our team</li>
                <li>Account credentials for platform access</li>
              </ul>
              <h4 className="text-white/80 font-semibold mt-4 mb-2 font-[Montserrat]">2.2 Information Collected Automatically</h4>
              <ul>
                <li>Device and browser information (IP address, browser type, operating system)</li>
                <li>Usage data (pages visited, time spent, referral sources)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
              <h4 className="text-white/80 font-semibold mt-4 mb-2 font-[Montserrat]">2.3 Enterprise Platform Data</h4>
              <ul>
                <li>Data processed through our agentic orchestration platform is governed by separate enterprise data processing agreements</li>
                <li>We do not use enterprise customer data to train our AI models without explicit consent</li>
                <li>All enterprise data is encrypted at rest and in transit</li>
              </ul>
            </Section>

            <Section title="3. How We Use Your Information">
              <p>We use collected information for the following purposes:</p>
              <ul>
                <li>To provide, maintain, and improve our services and platform</li>
                <li>To process Design Partner applications and manage partnerships</li>
                <li>To communicate with you about our services, updates, and opportunities</li>
                <li>To comply with legal obligations and enforce our agreements</li>
                <li>To detect, prevent, and address technical issues and security threats</li>
                <li>To conduct research and development for our AI technologies</li>
              </ul>
            </Section>

            <Section title="4. Data Sharing and Disclosure">
              <p>
                We do not sell your personal information. We may share information with:
              </p>
              <ul>
                <li><strong>Service Providers:</strong> Third-party vendors who assist in operating our platform, including cloud infrastructure providers (Google Cloud Platform), analytics services, and communication tools</li>
                <li><strong>Business Partners:</strong> With your consent, we may share information with technology partners for joint service delivery</li>
                <li><strong>Legal Requirements:</strong> When required by law, subpoena, or legal process</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              </ul>
            </Section>

            <Section title="5. Data Security">
              <p>
                We implement industry-standard security measures to protect your information, including:
              </p>
              <ul>
                <li>AES-256 encryption for data at rest</li>
                <li>TLS 1.3 encryption for data in transit</li>
                <li>Multi-factor authentication for platform access</li>
                <li>Regular security audits and penetration testing</li>
                <li>SOC 2 Type II compliance framework adherence</li>
                <li>Role-based access controls and least-privilege principles</li>
              </ul>
            </Section>

            <Section title="6. Your Rights (CCPA / GDPR)">
              <p>Depending on your jurisdiction, you may have the following rights:</p>
              <ul>
                <li><strong>Right to Access:</strong> Request a copy of the personal information we hold about you</li>
                <li><strong>Right to Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Right to Correction:</strong> Request correction of inaccurate personal information</li>
                <li><strong>Right to Portability:</strong> Receive your data in a structured, machine-readable format</li>
                <li><strong>Right to Opt-Out:</strong> Opt out of the sale of personal information (we do not sell personal information)</li>
                <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your privacy rights</li>
              </ul>
              <p>
                To exercise any of these rights, please contact us at <a href="mailto:admin@aitechpros.ai" className="text-[#3B82F6] hover:text-[#06B6D4] transition-colors">admin@aitechpros.ai</a>.
              </p>
            </Section>

            <Section title="7. AI-Specific Data Practices">
              <p>
                As an AI technology company, we maintain the following commitments regarding artificial intelligence and data:
              </p>
              <ul>
                <li>We do not use customer data to train general-purpose AI models without explicit, informed consent</li>
                <li>Our agentic AI systems operate within defined governance frameworks with human-in-the-loop oversight</li>
                <li>All AI model outputs are subject to configurable confidence thresholds and approval gates</li>
                <li>We maintain full audit trails for all autonomous agent actions</li>
                <li>Enterprise customers retain ownership of their data at all times</li>
              </ul>
            </Section>

            <Section title="8. Cookies and Tracking">
              <p>
                We use cookies and similar technologies to enhance your experience. You can control cookie preferences through your browser settings. We use:
              </p>
              <ul>
                <li><strong>Essential Cookies:</strong> Required for basic site functionality</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our site</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
              </ul>
            </Section>

            <Section title="9. Data Retention">
              <p>
                We retain personal information only for as long as necessary to fulfill the purposes described in this policy, unless a longer retention period is required by law. Enterprise platform data retention is governed by individual customer agreements.
              </p>
            </Section>

            <Section title="10. Changes to This Policy">
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the updated policy on our website with a revised "Last updated" date.
              </p>
            </Section>

            <Section title="11. Contact Us">
              <p>
                If you have questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="glass-card rounded-xl p-5 mt-4">
                <p className="text-white/70 text-sm leading-relaxed">
                  <strong className="text-white">AI Tech Pros, Inc.</strong><br />
                  217 Davis Road<br />
                  Augusta, GA 30907<br />
                  United States<br /><br />
                  Email: <a href="mailto:admin@aitechpros.ai" className="text-[#3B82F6] hover:text-[#06B6D4] transition-colors">admin@aitechpros.ai</a>
                </p>
              </div>
            </Section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-xl p-6 lg:p-8">
      <h3 className="text-xl font-bold text-white font-[Montserrat] mb-4">{title}</h3>
      <div className="text-sm text-white/55 leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_strong]:text-white/70">
        {children}
      </div>
    </div>
  );
}
