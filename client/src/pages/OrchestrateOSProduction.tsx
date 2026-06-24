/*
 * Production vs demo — how to ship governed resume in OrchestrateOS.
 */
import { Link } from "wouter";
import OrchestrateOSSubpage, { SubSection } from "@/components/OrchestrateOSSubpage";

const productionPath = [
  "Onboard at /onboarding → runner API key",
  "pip install resume_engine[remote] + RemoteCheckpointStore",
  "start_run with tenant-scoped runner key",
  "execute_step / SDK resume on failure",
  "Operator clears gates (compensate, approve, consensus, prod ack)",
  "Export compliance bundle from partner dashboard or GET /runs/:id/compliance_export",
];

const demoPath = [
  "Landing gate explorer with seeded demo runs",
  "/governance nine-agent kernel lab (POST /kernel/run)",
  "Ingress webhook experiments (optional)",
];

export default function OrchestrateOSProduction() {
  return (
    <OrchestrateOSSubpage
      eyebrow="Operator guide"
      title={
        <>
          Production path vs <span className="gradient-text">demo lab</span>
        </>
      }
      subtitle="OrchestrateOS is a governed resume control plane. Production partners use the SDK and gate APIs — not the nine-agent LLM kernel."
    >
      <SubSection title="Use in production">
        <ol className="list-decimal pl-5 space-y-2 text-white/60 text-sm">
          {productionPath.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-white/50">
          Partner dashboard:{" "}
          <Link href="/partner/dashboard" className="text-[#06B6D4] hover:underline">
            /partner/dashboard
          </Link>{" "}
          · Install:{" "}
          <Link href="/install" className="text-[#06B6D4] hover:underline">
            /install
          </Link>
        </p>
      </SubSection>

      <SubSection title="Demo & sales only">
        <ul className="list-disc pl-5 space-y-2 text-white/60 text-sm">
          {demoPath.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-white/50">
          Try gates:{" "}
          <Link href="/#gates" className="text-[#06B6D4] hover:underline">
            gate explorer
          </Link>{" "}
          · Architecture lab:{" "}
          <Link href="/governance" className="text-[#06B6D4] hover:underline">
            /governance
          </Link>
        </p>
      </SubSection>

      <SubSection title="Nine agents — how to think about them">
        <p>
          Each agent names an operational role mapped to real API primitives (ingress, gates,
          audit, observer). Only <strong className="text-white/80">Executor</strong> maps to your
          workflow code. Only <strong className="text-white/80">Gatekeeper</strong> enforcement is
          code-backed via <code className="text-[#06B6D4] text-xs">resume_blockers</code> — not LLM
          output.
        </p>
      </SubSection>

      <SubSection title="Compliance export">
        <p>
          <code className="text-[#06B6D4] text-sm">GET /runs/&#123;id&#125;/compliance_export</code>{" "}
          returns a JSON bundle: steps, gate state, audit events, replay payload, and idempotency
          analysis. Download from the gate explorer or partner dashboard for compliance reviewers.
        </p>
        <p className="mt-2">
          <Link href="/compliance" className="text-[#06B6D4] hover:underline">
            Compliance positioning →
          </Link>
        </p>
      </SubSection>

      <SubSection title="Tenant gate policies">
        <p>
          Admins can set per-partner defaults (prod acknowledgment, consensus minimum reviewers)
          via <code className="text-[#06B6D4] text-xs">PUT /api/admin/partners/:id/gate-policy</code>.
          Policies apply automatically on <code className="text-[#06B6D4] text-xs">start_run</code>{" "}
          for that tenant.
        </p>
      </SubSection>

      <SubSection title="Enterprise roadmap">
        <p className="text-white/55 text-sm">
          Planned: SSO for partner portal, automated retry policy apply from optimizer metrics,
          custom domain, dedicated single-tenant control plane. See{" "}
          <code className="text-white/40 text-xs">docs/orchestrateos/enterprise-roadmap.md</code> in
          the repository.
        </p>
      </SubSection>
    </OrchestrateOSSubpage>
  );
}
