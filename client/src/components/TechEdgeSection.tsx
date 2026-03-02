/*
 * Design: Quantum Glass — Luminous Glassmorphism
 * Technical Edge: "Our Moat" — proprietary agentic orchestration layer
 * Features architecture diagram + sophisticated bullet points
 * Google Cloud technology stack callout for Google for Startups qualification
 * Tone: Technical authority, investor-grade depth
 */
import { useInView } from "@/hooks/useInView";
import { Brain, Zap, Database, Shield, GitBranch, Cpu, Cloud, Server } from "lucide-react";

const TECH_DIAGRAM = "https://d2xsxph8kpxj0f.cloudfront.net/310419663028368274/RDzc8Kay9NxmabXz39Hgzg/tech-edge-diagram_b87c9d65.png";

const pillars = [
  {
    icon: Brain,
    title: "Persistent Agentic Memory",
    description:
      "Our agents maintain long-term episodic and semantic memory across sessions, enabling contextual reasoning that improves with every interaction — not just within a conversation, but across deployments.",
  },
  {
    icon: Zap,
    title: "Sub-200ms Orchestration Latency",
    description:
      "A custom event-driven runtime replaces traditional request-response patterns. Agents communicate via an internal message bus optimized for real-time multi-step task execution at enterprise scale.",
  },
  {
    icon: GitBranch,
    title: "Dynamic Multi-Model Routing",
    description:
      "Our orchestration layer intelligently routes each sub-task to the optimal model — balancing cost, latency, and capability. GPT-4o for reasoning, Claude for analysis, Gemini for multimodal, local models for sensitive data.",
  },
  {
    icon: Database,
    title: "Stateful Tool-Use Framework",
    description:
      "Agents maintain transactional state across tool invocations, enabling complex multi-step workflows (CRM → ERP → email → Slack) with automatic rollback on failure and full audit trails.",
  },
  {
    icon: Shield,
    title: "Human-in-the-Loop Governance",
    description:
      "Configurable approval gates, confidence thresholds, and escalation policies ensure autonomous agents operate within defined guardrails — critical for regulated industries.",
  },
  {
    icon: Cpu,
    title: "Composable Agent Primitives",
    description:
      "A library of battle-tested agent building blocks — planners, executors, evaluators, critics — that can be composed into novel architectures without starting from scratch.",
  },
];

const gcpStack = [
  { name: "Vertex AI", description: "Model training, fine-tuning & managed inference endpoints" },
  { name: "BigQuery", description: "Enterprise analytics, data warehousing & ML feature stores" },
  { name: "GKE", description: "Kubernetes-based agent runtime & auto-scaling orchestration" },
  { name: "Cloud Run", description: "Serverless agent execution for event-driven workflows" },
  { name: "Gemini API", description: "Multimodal reasoning & document understanding" },
  { name: "Cloud Storage", description: "Persistent memory & artifact management at scale" },
];

export default function TechEdgeSection() {
  const { ref, isInView } = useInView({ threshold: 0.05 });
  const { ref: gcpRef, isInView: gcpInView } = useInView({ threshold: 0.05 });

  return (
    <section id="tech-edge" className="relative py-16 lg:py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0D17] via-[#0E1225] to-[#0B0D17]" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#06B6D4]/5 rounded-full blur-[150px] animate-float-delayed" />
      <div className="absolute top-1/3 -left-20 w-[400px] h-[400px] bg-[#3B82F6]/5 rounded-full blur-[120px] animate-float" />

      <div className="container relative z-10" ref={ref}>
        {/* Section header */}
        <div
          className={`text-center mb-16 transition-all duration-700 ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="text-sm font-medium text-[#06B6D4] tracking-widest uppercase font-[Montserrat] mb-4 block">
            Our Technical Edge
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-[Montserrat] mb-5">
            The Proprietary <span className="gradient-text">Orchestration Layer</span>
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto text-lg leading-relaxed">
            We are not building another chatbot wrapper. Our agentic orchestration engine is a vertically-integrated runtime purpose-built for autonomous enterprise workflows.
          </p>
        </div>

        {/* Architecture diagram */}
        <div
          className={`glass-card rounded-2xl overflow-hidden mb-14 transition-all duration-700 ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "200ms" }}
        >
          <div className="p-4 lg:p-6">
            <img
              src={TECH_DIAGRAM}
              alt="AITechPros Agentic Orchestration Architecture — showing the five-layer stack: Agent Primitives, Memory Layer, Model Router, Tool Framework, and Governance Engine"
              className="w-full h-auto rounded-xl"
              loading="lazy"
            />
          </div>
          <div className="px-6 pb-5 flex items-center gap-2">
            <span className="text-xs text-white/30 font-[Montserrat]">
              Fig. 1 — Agentic Orchestration Architecture (Simplified)
            </span>
          </div>
        </div>

        {/* Technical pillars grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pillars.map((pillar, i) => (
            <div
              key={pillar.title}
              className={`glass-card rounded-xl p-6 group transition-all duration-700 ${
                isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${100 * i + 400}ms` }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B82F6]/15 to-[#06B6D4]/15 border border-white/[0.06] flex items-center justify-center mb-4 group-hover:border-[#3B82F6]/30 transition-colors duration-300">
                <pillar.icon className="w-5 h-5 text-[#3B82F6]" />
              </div>
              <h3 className="text-base font-semibold text-white font-[Montserrat] mb-2">
                {pillar.title}
              </h3>
              <p className="text-sm text-white/45 leading-relaxed">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>

        {/* Google Cloud Platform Stack */}
        <div ref={gcpRef} className="mt-20">
          <div
            className={`text-center mb-12 transition-all duration-700 ${
              gcpInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="text-sm font-medium text-[#06B6D4] tracking-widest uppercase font-[Montserrat] mb-4 block">
              Infrastructure
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-[Montserrat] mb-5">
              Powered by <span className="gradient-text">Google Cloud</span>
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto text-base leading-relaxed">
              Our entire platform runs on Google Cloud Platform, leveraging its world-class AI/ML infrastructure, global network, and enterprise-grade security to deliver autonomous agent orchestration at scale.
            </p>
          </div>

          {/* GCP Stack Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {gcpStack.map((service, i) => (
              <div
                key={service.name}
                className={`glass-card rounded-xl p-5 group transition-all duration-700 ${
                  gcpInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${80 * i + 200}ms` }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4285F4]/15 to-[#34A853]/15 border border-white/[0.06] flex items-center justify-center group-hover:border-[#4285F4]/30 transition-colors duration-300">
                    <Cloud className="w-4 h-4 text-[#4285F4]" />
                  </div>
                  <h4 className="text-sm font-semibold text-white font-[Montserrat]">
                    {service.name}
                  </h4>
                </div>
                <p className="text-xs text-white/40 leading-relaxed">
                  {service.description}
                </p>
              </div>
            ))}
          </div>

          {/* Live Product Callout — NegotiateMedicalBill.ai */}
          <div
            className={`glass-card rounded-2xl p-6 lg:p-8 border-[#4285F4]/20 transition-all duration-700 ${
              gcpInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "700ms" }}
          >
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4285F4]/20 to-[#34A853]/20 border border-[#4285F4]/20 flex items-center justify-center shrink-0">
                <Server className="w-7 h-7 text-[#4285F4]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-white font-[Montserrat]">
                    Live on Google Cloud
                  </h3>
                  <span className="relative flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                      Production
                    </span>
                  </span>
                </div>
                <p className="text-sm text-white/50 leading-relaxed">
                  <a
                    href="https://negotiatemedicalbill.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#3B82F6] hover:text-[#06B6D4] transition-colors font-semibold"
                  >
                    NegotiateMedicalBill.ai
                  </a>
                  {" "}— Our AI-powered medical bill negotiation platform is fully hosted on Google Cloud Platform, utilizing Vertex AI for intelligent document analysis, BigQuery for claims data analytics, and GKE for scalable agent orchestration. This production deployment demonstrates our platform's real-world capability to reduce healthcare costs through autonomous AI negotiation agents.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom divider */}
      <div className="gradient-divider mt-10" />
    </section>
  );
}
