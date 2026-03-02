/*
 * Design: Quantum Glass — Luminous Glassmorphism
 * Contact: Design Partnership application form
 * Venture-worthy — selective, high-signal application process
 * Split layout: left info + newsletter, right application form
 */
import { useState } from "react";
import { useInView } from "@/hooks/useInView";
import { Mail, MapPin, Phone, Send, ArrowRight, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function ContactSection() {
  const { ref, isInView } = useInView({ threshold: 0.05 });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    role: "",
    stage: "",
    message: "",
  });
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Send form data via mailto link as a fallback
      const subject = encodeURIComponent(`Design Partner Application: ${formData.company}`);
      const body = encodeURIComponent(
        `New Design Partner Application\n\n` +
        `Name: ${formData.name}\n` +
        `Email: ${formData.email}\n` +
        `Company: ${formData.company}\n` +
        `Role: ${formData.role}\n` +
        `Stage: ${formData.stage}\n\n` +
        `AI Challenge:\n${formData.message}`
      );
      window.open(`mailto:henry.jenkins@aitechpros.ai?subject=${subject}&body=${body}`, '_blank');
      setFormSubmitted(true);
      toast.success("Application received. We'll review and respond within 48 hours.");
    } catch {
      toast.error("Something went wrong. Please email henry.jenkins@aitechpros.ai directly.");
    }
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent('Newsletter Subscription: AITechPros Technical Deep-Dives');
    const body = encodeURIComponent(`Please add ${newsletterEmail} to the AITechPros Technical Deep-Dives newsletter.`);
    window.open(`mailto:henry.jenkins@aitechpros.ai?subject=${subject}&body=${body}`, '_blank');
    setNewsletterSubmitted(true);
    toast.success("Welcome! You'll receive our next technical deep-dive.");
  };

  return (
    <section id="contact" className="relative py-16 lg:py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0D17] via-[#0E1225] to-[#0B0D17]" />
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#3B82F6]/5 rounded-full blur-[150px] animate-float" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[#06B6D4]/5 rounded-full blur-[120px] animate-float-delayed" />

      <div className="container relative z-10" ref={ref}>
        {/* Section header */}
        <div
          className={`text-center mb-16 transition-all duration-700 ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="text-sm font-medium text-[#06B6D4] tracking-widest uppercase font-[Montserrat] mb-4 block">
            Apply Now
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-[Montserrat] mb-5">
            Join the <span className="gradient-text">Design Partner Cohort</span>
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto text-lg leading-relaxed">
            We partner with a select group of forward-thinking enterprises. Tell us about your organization and the AI challenges you're looking to solve.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Left: Contact info */}
          <div
            className={`lg:col-span-2 space-y-8 transition-all duration-700 ${
              isInView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
            style={{ transitionDelay: "200ms" }}
          >
            <div>
              <h3 className="text-xl font-bold text-white font-[Montserrat] mb-6">
                Get in Touch
              </h3>
              <div className="space-y-5">
                {[
                  { icon: Mail, label: "support@aitechpros.ai", href: "mailto:support@aitechpros.ai" },
                  { icon: Phone, label: "+1-404-333-2968", href: "tel:+14043332968" },
                  { icon: MapPin, label: "217 Davis Road, Augusta, GA 30907", href: "https://maps.google.com/?q=217+Davis+Road+Augusta+GA+30907" },
                ].map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-4 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B82F6]/15 to-[#06B6D4]/15 border border-white/[0.06] flex items-center justify-center shrink-0 group-hover:border-[#3B82F6]/30 transition-colors duration-300">
                      <item.icon className="w-4 h-4 text-[#3B82F6]" />
                    </div>
                    <span className="text-white/60 group-hover:text-white transition-colors text-sm">
                      {item.label}
                    </span>
                  </a>
                ))}
              </div>
            </div>

            {/* Newsletter signup */}
            <div className="glass-card rounded-2xl p-6">
              <h4 className="text-base font-semibold text-white font-[Montserrat] mb-2">
                Technical Deep-Dives
              </h4>
              <p className="text-sm text-white/40 mb-4">
                Monthly insights on agentic architecture, multi-model orchestration, and the future of autonomous enterprise AI.
              </p>
              {newsletterSubmitted ? (
                <div className="flex items-center gap-2 text-[#06B6D4]">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">You're subscribed!</span>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#3B82F6]/40 focus:outline-none focus:ring-1 focus:ring-[#3B82F6]/20 transition-all"
                  />
                  <button
                    type="submit"
                    className="glow-btn text-white px-4 py-2.5 rounded-lg flex items-center justify-center"
                    aria-label="Subscribe"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>

            {/* Ideal partner profile */}
            <div className="glass-card rounded-2xl p-6">
              <h4 className="text-base font-semibold text-white font-[Montserrat] mb-3">
                Ideal Partner Profile
              </h4>
              <ul className="space-y-2.5">
                {[
                  "Growth-stage enterprise with established revenue",
                  "Complex, multi-system workflows to automate",
                  "Dedicated engineering team for integration",
                  "Willingness to co-develop at the frontier",
                  "Executive sponsor with AI mandate",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-[#3B82F6] shrink-0 mt-0.5" />
                    <span className="text-sm text-white/45">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: Application form */}
          <div
            className={`lg:col-span-3 transition-all duration-700 ${
              isInView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
            style={{ transitionDelay: "300ms" }}
          >
            <div className="glass-card rounded-2xl p-7 lg:p-9">
              {formSubmitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#3B82F6]/20 to-[#06B6D4]/20 flex items-center justify-center mx-auto mb-5">
                    <CheckCircle className="w-8 h-8 text-[#06B6D4]" />
                  </div>
                  <h3 className="text-2xl font-bold text-white font-[Montserrat] mb-3">
                    Application Received
                  </h3>
                  <p className="text-white/50 max-w-md mx-auto">
                    Thank you for your interest. Our team will review your application and respond within 48 business hours to discuss potential alignment.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-5">
                  <h3 className="text-xl font-bold text-white font-[Montserrat] mb-1">
                    Apply for Design Partnership
                  </h3>
                  <p className="text-sm text-white/40 mb-6">
                    Tell us about your organization and the challenges you're looking to solve with autonomous AI.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm text-white/60 mb-2 font-medium">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Jane Smith"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-[#3B82F6]/40 focus:outline-none focus:ring-1 focus:ring-[#3B82F6]/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/60 mb-2 font-medium">Work Email</label>
                      <input
                        type="email"
                        required
                        placeholder="jane@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-[#3B82F6]/40 focus:outline-none focus:ring-1 focus:ring-[#3B82F6]/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm text-white/60 mb-2 font-medium">Company</label>
                      <input
                        type="text"
                        required
                        placeholder="Acme Corporation"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-[#3B82F6]/40 focus:outline-none focus:ring-1 focus:ring-[#3B82F6]/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/60 mb-2 font-medium">Your Role</label>
                      <input
                        type="text"
                        required
                        placeholder="CTO / VP Engineering / Founder"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-[#3B82F6]/40 focus:outline-none focus:ring-1 focus:ring-[#3B82F6]/20 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-2 font-medium">Company Stage</label>
                    <select
                      required
                      value={formData.stage}
                      onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                      className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white focus:border-[#3B82F6]/40 focus:outline-none focus:ring-1 focus:ring-[#3B82F6]/20 transition-all appearance-none"
                    >
                      <option value="" disabled className="bg-[#0B0D17]">Select stage...</option>
                      <option value="early" className="bg-[#0B0D17]">Early Stage</option>
                      <option value="growth" className="bg-[#0B0D17]">Growth Stage</option>
                      <option value="scale" className="bg-[#0B0D17]">Scale-Up</option>
                      <option value="enterprise" className="bg-[#0B0D17]">Enterprise ($100M+ revenue)</option>
                      <option value="public" className="bg-[#0B0D17]">Public Company</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-2 font-medium">
                      What AI challenge are you looking to solve?
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Describe your highest-value automation targets, current tech stack, and what success looks like..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-[#3B82F6]/40 focus:outline-none focus:ring-1 focus:ring-[#3B82F6]/20 transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="glow-btn text-white font-semibold px-8 py-3.5 rounded-lg text-sm w-full flex items-center justify-center gap-2 group"
                  >
                    <Send className="w-4 h-4" />
                    Submit Application
                    <ArrowRight className="w-4 h-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
