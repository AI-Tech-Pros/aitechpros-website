/*
 * OrchestrateOS gate status explorer — live API demo runs + offline preview
 */
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Lock,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  UserCheck,
  Wifi,
  WifiOff,
} from "lucide-react";
import { DEMO_RUN_CATALOG } from "@/lib/orchestrateos-demo";
import {
  ackProdResume,
  fetchApiHealth,
  fetchResumeBlockers,
  grantApproval,
  recordCompensation,
  resetDemoRuns,
  type ResumeBlocker,
} from "@/lib/orchestrateos-api";
import { orchestrateOSApiBaseUrl, orchestrateOSApiDocsUrl, orchestrateOSApiKey } from "@/lib/site";

type DemoScenario = "transient" | "partial" | "permanent";

type DemoState = {
  compensated: boolean;
  approved: boolean;
};

const SCENARIO_META: Record<
  DemoScenario,
  { label: string; color: string; description: string }
> = {
  transient: {
    label: "Transient",
    color: "text-[#06B6D4]",
    description: "Prod run — transient failure still needs operator acknowledgment.",
  },
  partial: {
    label: "Partial",
    color: "text-amber-400",
    description: "Side effects ran — compensation required before retry.",
  },
  permanent: {
    label: "Permanent",
    color: "text-red-400",
    description: "Invalid config — human operator must approve resume.",
  },
};

function BlockerCard({ blocker }: { blocker: ResumeBlocker }) {
  const isCompensation = blocker.required_action === "compensation";
  const isProdAck = blocker.required_action === "prod_resume_ack";
  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
      <div className="flex items-start gap-3">
        {isCompensation ? (
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        ) : isProdAck ? (
          <Lock className="w-5 h-5 text-[#06B6D4] shrink-0 mt-0.5" />
        ) : (
          <Lock className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white font-[Montserrat]">
            {isCompensation
              ? "Compensation required"
              : isProdAck
                ? "Production resume acknowledgment required"
                : "Human approval required"}
          </p>
          <p className="text-xs text-white/45 mt-1">
            Step {blocker.step_index + 1}:{" "}
            <code className="text-[#06B6D4]">{blocker.step_name}</code>
          </p>
          <p className="text-sm text-white/55 mt-2">{blocker.message}</p>
          <p className="text-[10px] text-white/30 mt-2 font-mono">{blocker.failure_key}</p>
        </div>
      </div>
    </div>
  );
}

function ResumeStatusBanner({ canResume }: { canResume: boolean }) {
  return (
    <div
      className={`rounded-xl p-4 flex items-center gap-3 border ${
        canResume
          ? "border-emerald-500/25 bg-emerald-500/10"
          : "border-amber-500/25 bg-amber-500/10"
      }`}
    >
      {canResume ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
      ) : (
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
      )}
      <div>
        <p className="text-sm font-semibold text-white font-[Montserrat]">
          {canResume ? "Resume allowed" : "Resume blocked"}
        </p>
        <p className="text-xs text-white/50 mt-0.5">
          {canResume
            ? "All gates cleared — engine.resume(run_id) may proceed."
            : "Clear the gate below before calling resume()."}
        </p>
      </div>
    </div>
  );
}

export default function OrchestrateOSGatePanel() {
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [mode, setMode] = useState<"live" | "preview">("live");
  const [scenario, setScenario] = useState<DemoScenario>("partial");
  const [demoState, setDemoState] = useState<DemoState>({ compensated: false, approved: false });
  const [runId, setRunId] = useState("");
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [liveBlockers, setLiveBlockers] = useState<ResumeBlocker[] | null>(null);
  const [liveCanResume, setLiveCanResume] = useState<boolean | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [approver, setApprover] = useState("ops@example.com");
  const [actionLoading, setActionLoading] = useState(false);
  const hasDemoApiKey = Boolean(orchestrateOSApiKey());

  const checkHealth = useCallback(async () => {
    try {
      await fetchApiHealth();
      setApiOnline(true);
    } catch {
      setApiOnline(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  const lookupRun = useCallback(async (id?: string) => {
    const target = (id ?? runId).trim();
    if (!target) return;
    setRunId(target);
    setActiveRunId(target);
    setLiveLoading(true);
    setLiveError(null);
    try {
      const data = await fetchResumeBlockers(target);
      setLiveBlockers(data.blockers);
      setLiveCanResume(data.can_resume);
    } catch (err) {
      setLiveError(err instanceof Error ? err.message : "Lookup failed");
      setLiveBlockers(null);
      setLiveCanResume(null);
    } finally {
      setLiveLoading(false);
    }
  }, [runId]);

  const handleResetDemos = async () => {
    setActionLoading(true);
    setLiveError(null);
    try {
      await resetDemoRuns();
      if (activeRunId) await lookupRun(activeRunId);
    } catch (err) {
      setLiveError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompensate = async () => {
    if (!activeRunId) return;
    setActionLoading(true);
    setLiveError(null);
    try {
      await recordCompensation(activeRunId, {
        result: { reversed: true },
        note: "Demo compensation via gate explorer",
      });
      await lookupRun(activeRunId);
    } catch (err) {
      setLiveError(err instanceof Error ? err.message : "Compensation failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!activeRunId || !approver.trim()) return;
    setActionLoading(true);
    setLiveError(null);
    try {
      await grantApproval(activeRunId, {
        approved_by: approver.trim(),
        note: "Demo approval via gate explorer",
      });
      await lookupRun(activeRunId);
    } catch (err) {
      setLiveError(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleProdAck = async () => {
    if (!activeRunId || !approver.trim()) return;
    setActionLoading(true);
    setLiveError(null);
    try {
      await ackProdResume(activeRunId, {
        acknowledged_by: approver.trim(),
        note: "Demo prod resume acknowledgment via gate explorer",
      });
      await lookupRun(activeRunId);
    } catch (err) {
      setLiveError(err instanceof Error ? err.message : "Production acknowledgment failed");
    } finally {
      setActionLoading(false);
    }
  };

  const resetPreview = (next: DemoScenario) => {
    setScenario(next);
    setDemoState({ compensated: false, approved: false });
  };

  const previewCanResume =
    (scenario === "transient" && demoState.approved) ||
    (scenario === "partial" && demoState.compensated) ||
    (scenario === "permanent" && demoState.approved);

  const previewBlockers: ResumeBlocker[] = (() => {
    if (scenario === "transient" && !demoState.approved) {
      return [
        {
          classification: "transient",
          step_index: 6,
          step_name: "call_llm",
          failure_key: "6:6",
          message: "Production resume requires operator acknowledgment",
          required_action: "prod_resume_ack",
        },
      ];
    }
    if (scenario === "partial" && !demoState.compensated) {
      return [
        {
          classification: "partial",
          step_index: 6,
          step_name: "send_notification",
          failure_key: "6:6",
          message: "Email sent but database write failed",
          required_action: "compensation",
        },
      ];
    }
    if (scenario === "permanent" && !demoState.approved) {
      return [
        {
          classification: "permanent",
          step_index: 2,
          step_name: "validate_credentials",
          failure_key: "2:2",
          message: "Invalid API credentials — rotation required",
          required_action: "human_approval",
        },
      ];
    }
    return [];
  })();

  const needsCompensation = liveBlockers?.some((b) => b.required_action === "compensation");
  const needsApproval = liveBlockers?.some((b) => b.required_action === "human_approval");
  const needsProdAck = liveBlockers?.some((b) => b.required_action === "prod_resume_ack");
  const writeActionsNeedKey = !hasDemoApiKey;

  return (
    <div className="glass-card rounded-2xl border-[#8B5CF6]/15 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b border-white/[0.06] bg-white/[0.02]">
        <div>
          <p className="text-xs uppercase tracking-wider text-[#8B5CF6] font-[Montserrat] mb-1">
            Resume gates
          </p>
          <h3 className="text-lg font-bold text-white font-[Montserrat]">Gate status explorer</h3>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border ${
              apiOnline === null
                ? "border-white/10 text-white/40"
                : apiOnline
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-white/10 bg-white/[0.03] text-white/40"
            }`}
          >
            {apiOnline === null ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : apiOnline ? (
              <Wifi className="w-3.5 h-3.5" />
            ) : (
              <WifiOff className="w-3.5 h-3.5" />
            )}
            API {apiOnline ? "online" : apiOnline === false ? "offline" : "checking"}
          </div>
          <button
            type="button"
            onClick={checkHealth}
            className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.05] transition-colors"
            aria-label="Refresh API status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex border-b border-white/[0.06]">
        {(["live", "preview"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMode(tab)}
            className={`flex-1 sm:flex-none px-6 py-3 text-sm font-medium transition-colors ${
              mode === tab
                ? "text-white border-b-2 border-[#8B5CF6]"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {tab === "live" ? "Live API demo" : "Offline preview"}
          </button>
        ))}
      </div>

      <div className="p-6 lg:p-8">
        {mode === "live" ? (
          <div className="space-y-6">
            <p className="text-sm text-white/50 leading-relaxed">
              Seeded runs on{" "}
              <a
                href={orchestrateOSApiDocsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#06B6D4] hover:underline"
              >
                {orchestrateOSApiBaseUrl().replace("https://", "")}
              </a>
              . Load a scenario, clear gates via the API, then reset demos to try again.
              {writeActionsNeedKey && (
                <span className="block mt-2 text-amber-300/80">
                  Write actions require <code className="text-[#06B6D4]">VITE_ORCHESTRATEOS_DEMO_KEY</code>{" "}
                  when API auth is enabled.
                </span>
              )}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {DEMO_RUN_CATALOG.map((demo) => (
                <button
                  key={demo.run_id}
                  type="button"
                  onClick={() => lookupRun(demo.run_id)}
                  disabled={liveLoading}
                  className={`rounded-xl p-4 text-left border transition-all disabled:opacity-60 ${
                    activeRunId === demo.run_id
                      ? "border-[#8B5CF6]/40 bg-[#8B5CF6]/10"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                  }`}
                >
                  <p
                    className={`text-sm font-semibold font-[Montserrat] ${SCENARIO_META[demo.scenario].color}`}
                  >
                    {demo.label}
                  </p>
                  <p className="text-xs text-white/45 mt-1 leading-relaxed">{demo.description}</p>
                  <p className="text-[10px] text-white/25 mt-2 font-mono truncate">{demo.run_id}</p>
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={runId}
                onChange={(e) => setRunId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && lookupRun()}
                placeholder="Or paste any run UUID"
                className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#8B5CF6]/40 font-mono"
              />
              <button
                type="button"
                onClick={() => lookupRun()}
                disabled={liveLoading || !runId.trim()}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {liveLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Check gates
              </button>
              <button
                type="button"
                onClick={handleResetDemos}
                disabled={actionLoading || apiOnline === false || writeActionsNeedKey}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/[0.1] text-white/70 text-sm hover:bg-white/[0.04] disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                Reset demos
              </button>
            </div>

            {liveError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300/80">
                {liveError.includes("Failed to fetch") || liveError.includes("NetworkError")
                  ? "Could not reach the API. Check deployment or try again shortly."
                  : liveError}
              </div>
            )}

            {liveCanResume !== null && !liveError && activeRunId && (
              <>
                <ResumeStatusBanner canResume={liveCanResume} />
                {liveBlockers?.map((b) => <BlockerCard key={b.failure_key} blocker={b} />)}
                {liveCanResume && liveBlockers?.length === 0 && (
                  <p className="text-sm text-white/45">
                    No active gates on run <code className="text-[#06B6D4]">{activeRunId}</code>.
                  </p>
                )}

                {needsCompensation && (
                  <button
                    type="button"
                    onClick={handleCompensate}
                    disabled={actionLoading || writeActionsNeedKey}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-sm font-semibold hover:bg-amber-500/25 transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShieldAlert className="w-4 h-4" />
                    )}
                    Record compensation (API)
                  </button>
                )}

                {needsApproval && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={approver}
                      onChange={(e) => setApprover(e.target.value)}
                      placeholder="approved_by"
                      className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={actionLoading || !approver.trim() || writeActionsNeedKey}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-200 text-sm font-semibold hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                      Grant approval (API)
                    </button>
                  </div>
                )}

                {needsProdAck && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={approver}
                      onChange={(e) => setApprover(e.target.value)}
                      placeholder="acknowledged_by"
                      className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleProdAck}
                      disabled={actionLoading || !approver.trim() || writeActionsNeedKey}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#06B6D4]/10 border border-[#06B6D4]/25 text-[#06B6D4] text-sm font-semibold hover:bg-[#06B6D4]/20 transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                      Acknowledge prod resume (API)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-sm text-white/40">
              Offline walkthrough — same gate logic without calling the API.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(Object.keys(SCENARIO_META) as DemoScenario[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => resetPreview(key)}
                  className={`rounded-xl p-4 text-left border transition-all ${
                    scenario === key
                      ? "border-[#8B5CF6]/40 bg-[#8B5CF6]/10"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                  }`}
                >
                  <p className={`text-sm font-semibold font-[Montserrat] ${SCENARIO_META[key].color}`}>
                    {SCENARIO_META[key].label}
                  </p>
                  <p className="text-xs text-white/45 mt-1 leading-relaxed">
                    {SCENARIO_META[key].description}
                  </p>
                </button>
              ))}
            </div>

            <ResumeStatusBanner canResume={previewCanResume} />
            {previewBlockers.map((b) => (
              <BlockerCard key={b.failure_key} blocker={b} />
            ))}

            {scenario === "transient" && !demoState.approved && (
              <button
                type="button"
                onClick={() => setDemoState((s) => ({ ...s, approved: true }))}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#06B6D4]/10 border border-[#06B6D4]/25 text-[#06B6D4] text-sm font-semibold hover:bg-[#06B6D4]/20 transition-colors"
              >
                <UserCheck className="w-4 h-4" />
                Simulate prod acknowledgment
              </button>
            )}

            {scenario === "partial" && !demoState.compensated && (
              <button
                type="button"
                onClick={() => setDemoState((s) => ({ ...s, compensated: true }))}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-sm font-semibold hover:bg-amber-500/25 transition-colors"
              >
                <ShieldAlert className="w-4 h-4" />
                Simulate compensation
              </button>
            )}

            {scenario === "permanent" && !demoState.approved && (
              <button
                type="button"
                onClick={() => setDemoState((s) => ({ ...s, approved: true }))}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-200 text-sm font-semibold hover:bg-red-500/20 transition-colors"
              >
                <UserCheck className="w-4 h-4" />
                Simulate operator approval
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
