import { useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import { ExternalLink } from "lucide-react";
import OrchestrateOSNavbar from "@/components/OrchestrateOSNavbar";
import PartnerRoute from "@/components/PartnerRoute";
import PartnerJourneyPanel from "@/components/PartnerJourneyPanel";
import GovernanceMetricsPanel from "@/components/GovernanceMetricsPanel";
import ComplianceExportPanel from "@/components/ComplianceExportPanel";
import RunTimeline from "@/components/RunTimeline";
import {
  fetchPartnerJourney,
  fetchPartnerMe,
  fetchPartnerRuns,
  rotatePartnerApiKey,
  startPartnerFirstWorkflow,
  startPartnerSdkRun,
  type PartnerJourney,
  type PartnerProfile,
  type PartnerRun,
} from "@/lib/platform-api";
import { buildRemoteQuickstart, stashRunnerKey } from "@/lib/partner-credentials";
import { orchestrateOSApiBaseUrl, orchestrateOSApiDocsUrl } from "@/lib/site";
import { useSession } from "@/contexts/SessionContext";

function DashboardContent() {
  const search = useSearch();
  const welcome = useMemo(() => new URLSearchParams(search).get("welcome") === "1", [search]);
  const { session, signOut } = useSession();
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [journey, setJourney] = useState<PartnerJourney | null>(null);
  const [runs, setRuns] = useState<PartnerRun[]>([]);
  const [tenantId, setTenantId] = useState("");
  const [error, setError] = useState("");
  const [startingWorkflow, setStartingWorkflow] = useState(false);
  const [startingSdkRun, setStartingSdkRun] = useState(false);
  const [rotatingKey, setRotatingKey] = useState(false);
  const [workflowMessage, setWorkflowMessage] = useState<string | null>(null);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  async function refreshDashboard() {
    const me = await fetchPartnerMe();
    setPartner(me.partner);
    const [runData, journeyData] = await Promise.all([fetchPartnerRuns(), fetchPartnerJourney()]);
    setRuns(runData.runs);
    setTenantId(runData.tenant_id);
    setJourney(journeyData);
  }

  useEffect(() => {
    void (async () => {
      try {
        await refreshDashboard();
      } catch {
        setError("Could not load dashboard data.");
      }
    })();
  }, []);

  async function handleFirstWorkflow() {
    setStartingWorkflow(true);
    setWorkflowMessage(null);
    setError("");
    try {
      const result = await startPartnerFirstWorkflow();
      setWorkflowMessage(result.message);
      sessionStorage.setItem("orchestrateos_run_id", result.run_id);
      await refreshDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start sample workflow");
    } finally {
      setStartingWorkflow(false);
    }
  }

  async function handleStartSdkWorkflow() {
    setStartingSdkRun(true);
    setWorkflowMessage(null);
    setError("");
    try {
      const result = await startPartnerSdkRun({ workflow_name: "my_pipeline" });
      setWorkflowMessage(result.message);
      sessionStorage.setItem("orchestrateos_run_id", result.run_id);
      await refreshDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start SDK workflow");
    } finally {
      setStartingSdkRun(false);
    }
  }

  async function handleRotateKey() {
    setRotatingKey(true);
    setError("");
    setRevealedKey(null);
    try {
      const result = await rotatePartnerApiKey();
      stashRunnerKey(result.runner_api_key);
      setRevealedKey(result.runner_api_key);
      setWorkflowMessage(result.message);
      await refreshDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not issue API key");
    } finally {
      setRotatingKey(false);
    }
  }

  function openGateExplorer(runId: string) {
    sessionStorage.setItem("orchestrateos_run_id", runId);
    window.location.href = "/#gates";
  }

  const api = orchestrateOSApiBaseUrl();
  const sampleRunId = journey?.first_workflow_run_id ?? runs[0]?.run_id;
  const sdkSnippet =
    revealedKey && tenantId
      ? buildRemoteQuickstart(api, revealedKey, tenantId)
      : null;

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

        {welcome && (
          <p className="mb-6 text-sm text-[#06B6D4] border border-[#06B6D4]/20 rounded-xl px-4 py-3 bg-[#06B6D4]/5">
            Welcome — follow the checklist below to run your first workflow and wire the SDK.
          </p>
        )}

        {error && <p className="text-red-400 text-sm mb-6">{error}</p>}
        {workflowMessage && <p className="text-[#06B6D4] text-xs mb-6">{workflowMessage}</p>}

        {journey && <PartnerJourneyPanel journey={journey} />}
        <GovernanceMetricsPanel />

        {journey && journey.next_action === "issue_runner_key" && (
          <section className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-6 mb-8">
            <h2 className="text-white font-semibold mb-2">Issue your runner API key</h2>
            <p className="text-white/50 text-sm mb-4">
              No active API key found for this partner. Generate one to use the SDK and REST API.
            </p>
            <button
              type="button"
              onClick={() => void handleRotateKey()}
              disabled={rotatingKey}
              className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-200 border border-amber-500/30 text-sm font-medium disabled:opacity-50"
            >
              {rotatingKey ? "Issuing key…" : "Generate runner API key"}
            </button>
          </section>
        )}

        {revealedKey && sdkSnippet && (
          <section className="rounded-2xl border border-amber-500/30 bg-black/40 p-6 mb-8">
            <h2 className="text-white font-semibold mb-2">Your new runner API key</h2>
            <p className="text-amber-300/80 text-xs mb-3">Copy now — shown only once.</p>
            <pre className="text-xs font-mono text-white/80 overflow-x-auto whitespace-pre-wrap mb-4 p-3 rounded-lg bg-black/50 border border-white/10">
              {revealedKey}
            </pre>
            <pre className="text-xs font-mono text-[#06B6D4] overflow-x-auto whitespace-pre-wrap p-3 rounded-lg bg-black/50 border border-white/10">
              {sdkSnippet}
            </pre>
            <Link href="/install" className="inline-block mt-3 text-sm text-[#06B6D4] hover:underline">
              Full install guide →
            </Link>
          </section>
        )}

        {partner && (
          <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 mb-8">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-white">{partner.company_name}</h2>
              {journey?.steps.runner_key && (
                <button
                  type="button"
                  onClick={() => void handleRotateKey()}
                  disabled={rotatingKey}
                  className="text-xs text-white/40 hover:text-white border border-white/10 rounded-lg px-3 py-1.5 disabled:opacity-50"
                >
                  {rotatingKey ? "Rotating…" : "Rotate API key"}
                </button>
              )}
            </div>
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
          </section>
        )}

        {journey && journey.next_action === "run_sample_workflow" && (
          <section className="rounded-2xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 p-6 mb-8">
            <h2 className="text-lg font-semibold text-white mb-2">Next: run your sample workflow</h2>
            <p className="text-white/50 text-sm mb-4">
              Creates a completed checkpointed run scoped to your tenant — no SDK required.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void handleFirstWorkflow()}
                disabled={startingWorkflow || startingSdkRun}
                className="px-4 py-2 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 text-white text-sm font-medium"
              >
                {startingWorkflow ? "Creating…" : "Run sample workflow"}
              </button>
              {journey.steps.runner_key && (
                <button
                  type="button"
                  onClick={() => void handleStartSdkWorkflow()}
                  disabled={startingWorkflow || startingSdkRun}
                  className="px-4 py-2 rounded-lg border border-[#06B6D4]/40 text-[#06B6D4] text-sm font-medium disabled:opacity-50"
                >
                  {startingSdkRun ? "Starting…" : "Start SDK workflow"}
                </button>
              )}
            </div>
          </section>
        )}

        {journey && journey.next_action === "wire_sdk" && (
          <section className="rounded-2xl border border-[#06B6D4]/25 bg-[#06B6D4]/5 p-6 mb-8">
            <h2 className="text-lg font-semibold text-white mb-2">Next: connect the SDK and resume a real failure</h2>
            <p className="text-white/50 text-sm mb-4">
              Production path: wire <code className="text-[#06B6D4]">resume_engine[remote]</code>,
              fail a step in your workflow, clear gates here, and export the compliance bundle for
              reviewers. The nine-agent kernel on{" "}
              <Link href="/governance" className="text-[#06B6D4] hover:underline">
                /governance
              </Link>{" "}
              is architecture lab only.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void handleStartSdkWorkflow()}
                disabled={startingSdkRun}
                className="px-4 py-2 rounded-lg bg-[#06B6D4] text-[#0B0D17] text-sm font-medium disabled:opacity-50"
              >
                {startingSdkRun ? "Starting…" : "Start SDK workflow"}
              </button>
              <Link
                href="/install"
                className="px-4 py-2 rounded-lg border border-[#06B6D4]/40 text-[#06B6D4] text-sm font-medium"
              >
                Open install guide
              </Link>
              {sampleRunId && (
                <button
                  type="button"
                  onClick={() => openGateExplorer(sampleRunId)}
                  className="px-4 py-2 rounded-lg border border-white/15 text-white/70 text-sm"
                >
                  Review sample in gate explorer
                </button>
              )}
            </div>
          </section>
        )}

        {journey && journey.next_action === "explore" && sampleRunId && (
          <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 mb-8">
            <h2 className="text-lg font-semibold text-white mb-2">You&apos;re set up</h2>
            <p className="text-white/50 text-sm mb-4">
              Explore gates, audit trails, or run the nine-agent kernel on{" "}
              <Link href="/governance" className="text-[#06B6D4] hover:underline">
                /governance
              </Link>
              .
            </p>
            <button
              type="button"
              onClick={() => openGateExplorer(sampleRunId)}
              className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-sm"
            >
              Open gate explorer
            </button>
          </section>
        )}

        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
          <h2 className="text-lg font-semibold text-white mb-2">Your workflow runs</h2>
          <p className="text-white/40 text-sm mb-6">
            {runs.length} run{runs.length === 1 ? "" : "s"} · tenant{" "}
            <code className="text-[#06B6D4]">{tenantId || "—"}</code>
          </p>

          {runs.length === 0 ? (
            <p className="text-white/50 text-sm">Runs will appear here after your sample workflow or SDK sync.</p>
          ) : (
            <ul className="space-y-3">
              {runs.map((run) => (
                <li key={run.run_id} className="rounded-xl border border-white/[0.06] bg-black/30 overflow-hidden">
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-white font-mono text-xs break-all">{run.run_id}</p>
                    <p className="text-white/60 text-sm mt-1">
                      {run.workflow_name} · {run.status} · {run.environment}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedRunId((id) => (id === run.run_id ? null : run.run_id))
                      }
                      className="text-xs px-3 py-1.5 rounded-lg text-white/70 border border-white/10"
                    >
                      {expandedRunId === run.run_id ? "Hide timeline" : "Timeline & export"}
                    </button>
                    <button
                      type="button"
                      onClick={() => openGateExplorer(run.run_id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20"
                    >
                      Gate explorer
                    </button>
                    <a
                      href={`${api}/runs/${run.run_id}/audit_events`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-3 py-1.5 rounded-lg text-white/60 border border-white/10 inline-flex items-center gap-1"
                    >
                      Audit
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  </div>
                  {expandedRunId === run.run_id && (
                    <div className="border-t border-white/[0.06] p-4 space-y-4 bg-black/20">
                      <ComplianceExportPanel runId={run.run_id} partnerSession />
                      <RunTimeline runId={run.run_id} partnerSession compact />
                    </div>
                  )}
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
