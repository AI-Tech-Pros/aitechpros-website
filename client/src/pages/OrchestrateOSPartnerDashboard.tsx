import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ExternalLink } from "lucide-react";
import OrchestrateOSNavbar from "@/components/OrchestrateOSNavbar";
import PartnerRoute from "@/components/PartnerRoute";
import {
  fetchPartnerMe,
  fetchPartnerRuns,
  type PartnerProfile,
  type PartnerRun,
} from "@/lib/platform-api";
import { orchestrateOSApiBaseUrl, orchestrateOSApiDocsUrl } from "@/lib/site";
import { useSession } from "@/contexts/SessionContext";

function DashboardContent() {
  const { session, signOut } = useSession();
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [runs, setRuns] = useState<PartnerRun[]>([]);
  const [tenantId, setTenantId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const me = await fetchPartnerMe();
        setPartner(me.partner);
        const runData = await fetchPartnerRuns();
        setRuns(runData.runs);
        setTenantId(runData.tenant_id);
      } catch {
        setError("Could not load dashboard data.");
      }
    })();
  }, []);

  const api = orchestrateOSApiBaseUrl();

  return (
    <div className="min-h-screen bg-[#0B0D17]">
      <OrchestrateOSNavbar />
      <main className="container pt-24 pb-16 max-w-4xl">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white font-[Montserrat]">Partner dashboard</h1>
            <p className="text-white/50 text-sm mt-1">{session.email}</p>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="text-sm text-white/40 hover:text-white"
          >
            Sign out
          </button>
        </div>

        {error && <p className="text-red-400 text-sm mb-6">{error}</p>}

        {partner && (
          <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">{partner.company_name}</h2>
            <dl className="grid sm:grid-cols-3 gap-4 text-sm">
              <div>
                <dt className="text-white/40">Phase</dt>
                <dd className="text-white capitalize">{partner.phase}</dd>
              </div>
              <div>
                <dt className="text-white/40">Status</dt>
                <dd className="text-white capitalize">{partner.status}</dd>
              </div>
              <div>
                <dt className="text-white/40">Milestone</dt>
                <dd className="text-white">{partner.milestone ?? "—"}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-white/30 font-mono">tenant: {partner.slug}</p>
          </section>
        )}

        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
          <h2 className="text-lg font-semibold text-white mb-2">Your workflow runs</h2>
          <p className="text-white/40 text-sm mb-6">
            Runs synced via <code className="text-[#06B6D4]">RemoteCheckpointStore</code> with tenant{" "}
            <code className="text-[#06B6D4]">{tenantId || "—"}</code>.
          </p>

          {runs.length === 0 ? (
            <p className="text-white/50 text-sm">
              No runs yet. Wire the SDK with a runner key scoped to your tenant, then run your
              pipeline. See{" "}
              <Link href="/install" className="text-[#06B6D4] hover:underline">
                /install
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-3">
              {runs.map((run) => (
                <li
                  key={run.run_id}
                  className="rounded-xl border border-white/[0.06] bg-black/30 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div>
                    <p className="text-white font-mono text-xs break-all">{run.run_id}</p>
                    <p className="text-white/60 text-sm mt-1">
                      {run.workflow_name} · {run.status} · {run.environment}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`/#gates`}
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.href = `/#gates`;
                        sessionStorage.setItem("orchestrateos_run_id", run.run_id);
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20"
                    >
                      Gate explorer
                    </a>
                    <a
                      href={`${api}/runs/${run.run_id}/audit_events`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-3 py-1.5 rounded-lg text-white/60 border border-white/10 inline-flex items-center gap-1"
                    >
                      Audit
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href={orchestrateOSApiDocsUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-3 py-1.5 rounded-lg text-white/60 border border-white/10"
                    >
                      API docs
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default function OrchestrateOSPartnerDashboard() {
  return (
    <PartnerRoute>
      <DashboardContent />
    </PartnerRoute>
  );
}
