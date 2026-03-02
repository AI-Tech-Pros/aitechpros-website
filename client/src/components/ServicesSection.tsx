/*
 * Design: Quantum Glass — Luminous Glassmorphism
 * Services: Three glass cards with staggered elevation, blue glow borders on hover
 * Each card features generated 3D abstract imagery
 * Using CSS transitions with IntersectionObserver for scroll animations
 */
import { useInView } from "@/hooks/useInView";
import { Target, Brain, Workflow } from "lucide-react";

const AI_STRATEGY_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663028368274/RDzc8Kay9NxmabXz39Hgzg/ai-strategy-RqjiZSZHXv7zKmyUMdFWfN.webp";
const LLM_DEV_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663028368274/RDzc8Kay9NxmabXz39Hgzg/llm-development-JeZqiSJXCmUfEUGdJE8v9R.webp";
const WORKFLOW_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663028368274/RDzc8Kay9NxmabXz39Hgzg/workflow-automation-PrCcjnd7dbQXHfNvyE7rWY.webp";

const services = [
  {
    icon: Target,
    title: "AI Strategy & Roadmap",
    description:
      "We assess your enterprise data landscape, identify high-impact AI opportunities, and deliver a phased implementation roadmap aligned with your business objectives and ROI targets.",
    features: ["Data Maturity Assessment", "Opportunity Mapping", "Implementation Roadmap", "ROI Forecasting"],
    image: AI_STRATEGY_IMG,
  },
  {
    icon: Brain,
    title: "Custom LLM Development",
    description:
      "From fine-tuning foundation models to building proprietary architectures, we develop large language models tailored to your domain, ensuring accuracy, compliance, and scalability.",
    features: ["Model Fine-Tuning", "RAG Pipelines", "Domain Adaptation", "Compliance & Safety"],
    image: LLM_DEV_IMG,
  },
  {
    icon: Workflow,
    title: "Agentic AI & Autonomous Workflows",
    description:
      "We design and deploy goal-driven AI agents that reason, plan, and execute multi-step tasks autonomously, orchestrating tool use across your CRM, ERP, and data pipelines to eliminate manual bottlenecks at scale.",
    features: ["Multi-Agent Orchestration", "Tool-Use & Function Calling", "Human-in-the-Loop Guardrails", "Autonomous Task Execution"],
    image: WORKFLOW_IMG,
  },
];

export default function ServicesSection() {
  const { ref, isInView } = useInView({ threshold: 0.05 });

  return (
    <section id="services" className="relative py-16 lg:py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0B0D17]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#3B82F6]/5 rounded-full blur-[150px]" />

      <div className="container relative z-10" ref={ref}>
        {/* Section header */}
        <div
          className={`text-center mb-16 lg:mb-20 transition-all duration-700 ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="text-sm font-medium text-[#06B6D4] tracking-widest uppercase font-[Montserrat] mb-4 block">
            What We Do
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-[Montserrat] mb-5">
            Enterprise AI <span className="gradient-text">Solutions</span>
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto text-lg leading-relaxed">
            From strategic advisory to autonomous agent development, our core pillars transform how organizations leverage AI to drive productivity, reduce costs, and accelerate growth.
          </p>
        </div>

        {/* Service cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {services.map((service, i) => (
            <div
              key={service.title}
              className={`glass-card rounded-2xl overflow-hidden group transition-all duration-700 ${
                isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${150 * i + 200}ms` }}
            >
              {/* Card image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D17] via-[#0B0D17]/40 to-transparent" />
                <div className="absolute bottom-4 left-5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B82F6]/20 to-[#06B6D4]/20 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                    <service.icon className="w-5 h-5 text-[#3B82F6]" />
                  </div>
                </div>
              </div>

              {/* Card content */}
              <div className="p-6 lg:p-7">
                <h3 className="text-xl font-bold text-white font-[Montserrat] mb-3">
                  {service.title}
                </h3>
                <p className="text-white/50 text-sm leading-relaxed mb-5">
                  {service.description}
                </p>

                {/* Feature tags */}
                <div className="flex flex-wrap gap-2">
                  {service.features.map((feature) => (
                    <span
                      key={feature}
                      className="text-xs text-[#06B6D4]/80 bg-[#06B6D4]/8 border border-[#06B6D4]/15 px-3 py-1.5 rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom divider */}
      <div className="gradient-divider mt-10" />
    </section>
  );
}
