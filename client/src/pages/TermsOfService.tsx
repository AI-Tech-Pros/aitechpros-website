/*
 * Design: Quantum Glass — Luminous Glassmorphism
 * Terms of Service: Enterprise-grade terms for AI platform company
 * Demonstrates legal maturity — critical for Google for Startups AI tier
 */
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TermsOfService() {
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
              Terms of <span className="gradient-text">Service</span>
            </h1>
            <p className="text-white/40 text-sm">
              Last updated: March 1, 2026
            </p>
          </div>

          <div className="prose-policy space-y-8">
            <Section title="1. Acceptance of Terms">
              <p>
                By accessing or using the services provided by AI Tech Pros, Inc. ("AITechPros," "we," "us," or "our"), including our website at aitechpros.ai and our agentic AI orchestration platform (collectively, the "Services"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Services.
              </p>
              <p>
                If you are using the Services on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these Terms.
              </p>
            </Section>

            <Section title="2. Description of Services">
              <p>
                AITechPros provides an enterprise-grade agentic AI orchestration platform that enables autonomous workflow execution, multi-model routing, and intelligent task orchestration. Our Services include:
              </p>
              <ul>
                <li>Agentic AI orchestration engine and runtime environment</li>
                <li>Multi-model routing and optimization layer</li>
                <li>Enterprise integration framework (CRM, ERP, communication tools)</li>
                <li>Human-in-the-loop governance and compliance tools</li>
                <li>Design Partner Program for early-access collaboration</li>
                <li>Technical documentation, APIs, and developer resources</li>
              </ul>
            </Section>

            <Section title="3. Eligibility">
              <p>
                The Services are intended for use by businesses and professionals. You must be at least 18 years of age and have the legal capacity to enter into a binding agreement to use our Services. Our platform is designed for enterprise use and is not intended for consumer applications.
              </p>
            </Section>

            <Section title="4. User Accounts">
              <p>
                To access certain features of the Services, you may be required to create an account. You agree to:
              </p>
              <ul>
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain the security of your account credentials</li>
                <li>Promptly notify us of any unauthorized access or security breach</li>
                <li>Accept responsibility for all activities that occur under your account</li>
              </ul>
            </Section>

            <Section title="5. Intellectual Property">
              <p>
                All content, technology, and intellectual property associated with the Services, including but not limited to our agentic orchestration engine, algorithms, software, documentation, and branding, are owned by AI Tech Pros, Inc. and are protected by applicable intellectual property laws.
              </p>
              <p>
                You retain ownership of all data and content you submit through the Services. By using the Services, you grant us a limited, non-exclusive license to process your data solely for the purpose of providing the Services.
              </p>
            </Section>

            <Section title="6. Acceptable Use">
              <p>You agree not to use the Services to:</p>
              <ul>
                <li>Violate any applicable laws, regulations, or third-party rights</li>
                <li>Transmit malicious code, viruses, or harmful content</li>
                <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
                <li>Reverse engineer, decompile, or disassemble any part of the Services</li>
                <li>Use the Services for any purpose that is harmful, fraudulent, or deceptive</li>
                <li>Interfere with or disrupt the integrity or performance of the Services</li>
                <li>Use our AI systems to generate content that violates applicable laws or ethical guidelines</li>
              </ul>
            </Section>

            <Section title="7. AI-Specific Terms">
              <p>
                Given the nature of our AI-powered Services, the following additional terms apply:
              </p>
              <ul>
                <li><strong>No Guarantee of Accuracy:</strong> AI-generated outputs are provided "as-is" and may contain errors. Users are responsible for reviewing and validating all AI outputs before acting on them.</li>
                <li><strong>Human Oversight:</strong> Our platform includes configurable human-in-the-loop governance. Users are responsible for configuring appropriate approval gates and confidence thresholds for their use cases.</li>
                <li><strong>Model Updates:</strong> We may update, modify, or replace underlying AI models to improve performance. We will provide reasonable notice of material changes.</li>
                <li><strong>Data Usage:</strong> We do not use customer data to train general-purpose AI models without explicit consent. Enterprise data processing is governed by separate data processing agreements.</li>
              </ul>
            </Section>

            <Section title="8. Design Partner Program">
              <p>
                Participation in our Design Partner Program is subject to additional terms outlined in individual partnership agreements. Design Partners receive early access to platform features and provide feedback to help shape product development. Design Partner agreements may include:
              </p>
              <ul>
                <li>Non-disclosure obligations for pre-release features</li>
                <li>Feedback and collaboration requirements</li>
                <li>Preferential pricing and access terms</li>
                <li>Co-development and co-marketing opportunities</li>
              </ul>
            </Section>

            <Section title="9. Payment Terms">
              <p>
                Certain Services may require payment. Payment terms, including pricing, billing cycles, and refund policies, will be specified in your service agreement or order form. All fees are non-refundable unless otherwise stated in your agreement.
              </p>
            </Section>

            <Section title="10. Limitation of Liability">
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, AITECHPROS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICES.
              </p>
              <p>
                Our total liability for any claims arising under these Terms shall not exceed the amount you paid to us for the Services during the twelve (12) months preceding the claim.
              </p>
            </Section>

            <Section title="11. Indemnification">
              <p>
                You agree to indemnify and hold harmless AI Tech Pros, Inc., its officers, directors, employees, and agents from any claims, damages, losses, or expenses (including reasonable attorneys' fees) arising from your use of the Services or violation of these Terms.
              </p>
            </Section>

            <Section title="12. Termination">
              <p>
                We may suspend or terminate your access to the Services at any time for violation of these Terms or for any other reason with reasonable notice. Upon termination, your right to use the Services will immediately cease. Provisions that by their nature should survive termination will remain in effect.
              </p>
            </Section>

            <Section title="13. Governing Law">
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the State of Georgia, United States, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be resolved in the state or federal courts located in Augusta, Georgia.
              </p>
            </Section>

            <Section title="14. Changes to Terms">
              <p>
                We reserve the right to modify these Terms at any time. We will provide notice of material changes by posting the updated Terms on our website. Your continued use of the Services after such changes constitutes acceptance of the modified Terms.
              </p>
            </Section>

            <Section title="15. Contact Information">
              <p>
                For questions about these Terms of Service, please contact us:
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
