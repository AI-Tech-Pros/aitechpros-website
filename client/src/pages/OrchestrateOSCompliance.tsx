/*
 * Healthcare & finance compliance positioning for OrchestrateOS control plane.
 */
import OrchestrateOSSubpage, { SubSection } from "@/components/OrchestrateOSSubpage";
import { orchestrateOSApiBaseUrl, orchestrateOSApiDocsUrl } from "@/lib/site";

export default function OrchestrateOSCompliance() {
  return (
    <OrchestrateOSSubpage
      eyebrow="Compliance"
      title={
        <>
          Audit-ready <span className="gradient-text">governance</span>
        </>
      }
      subtitle="How OrchestrateOS supports regulated workflows: immutable audit trails, role-based API access, and environment-scoped resume rules."
    >
      <SubSection title="Data & residency">
        <p>
          The hosted control plane runs on Cloudflare Workers + D1 at the edge. Your workflow
          execution stays in your Python runtime — LangGraph, CrewAI, or internal services. Only
          checkpoint metadata (step inputs/outputs hashes, gate state, audit events) transits the
          API. No model prompts are required to use the control plane.
        </p>
        <p>
          API base:{" "}
          <a
            href={orchestrateOSApiBaseUrl()}
            className="text-[#06B6D4] hover:underline font-mono text-sm"
          >
            {orchestrateOSApiBaseUrl().replace("https://", "")}
          </a>
        </p>
      </SubSection>

      <SubSection title="Immutable audit trail">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <code className="text-[#06B6D4] text-sm">GET /runs/&#123;id&#125;/audit_events</code> —
            append-only governance log (start, step, compensate, approve, prod ack)
          </li>
          <li>
            <code className="text-[#06B6D4] text-sm">GET /runs/&#123;id&#125;/audit_log</code> —
            deterministic step trace for replay verification
          </li>
          <li>
            <code className="text-[#06B6D4] text-sm">GET /runs/&#123;id&#125;/replay</code> —
            export completed steps for byte-for-byte replay audits
          </li>
        </ul>
        <p>
          Full API reference:{" "}
          <a
            href={orchestrateOSApiDocsUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#06B6D4] hover:underline"
          >
            {orchestrateOSApiDocsUrl().replace("https://", "")}
          </a>
        </p>
      </SubSection>

      <SubSection title="Role-based access">
        <p>Bearer-token API keys with three roles:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-white/80">Auditor</strong> — read run status, audit, replay
          </li>
          <li>
            <strong className="text-white/80">Runner</strong> — start runs, record steps, validate
            resume
          </li>
          <li>
            <strong className="text-white/80">Operator</strong> — compensate, approve, acknowledge
            production resume
          </li>
        </ul>
      </SubSection>

      <SubSection title="Deployment environments">
        <p>
          Runs carry an <code className="text-[#06B6D4] text-sm">environment</code> tag (
          <code className="text-sm">dev</code>, <code className="text-sm">staging</code>,{" "}
          <code className="text-sm">prod</code>). Production failures — even transient ones —
          require explicit operator acknowledgment before <code className="text-sm">resume()</code>{" "}
          may proceed. This mirrors change-control expectations in healthcare and finance ops.
        </p>
      </SubSection>

      <SubSection title="Healthcare & finance use cases">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-white/80">Claims adjudication</strong> — partial notification
            failures trigger compensation before retry
          </li>
          <li>
            <strong className="text-white/80">Credential rotation</strong> — permanent config
            failures block resume until an operator approves
          </li>
          <li>
            <strong className="text-white/80">Production cutovers</strong> — prod environment gate
            prevents silent auto-resume after any failure
          </li>
        </ul>
        <p className="text-white/40 text-sm">
          OrchestrateOS is infrastructure software, not a HIPAA Business Associate by default.
          Design partners should complete their own regulatory assessment. Contact us for
          enterprise deployment options.
        </p>
      </SubSection>
    </OrchestrateOSSubpage>
  );
}
