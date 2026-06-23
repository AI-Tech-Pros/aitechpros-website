/*
 * OrchestrateOS gate status explorer — demo scenarios + live API lookup
 */
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Lock,
  RefreshCw,
  ShieldAlert,
  UserCheck,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  fetchApiHealth,
  fetchResumeBlockers,
  type ResumeBlocker,
} from "@/lib/orchestrateos-api";
import { orchestrateOSApiBaseUrl, orchestrateOSApiDocsUrl } from "@/lib/site";

type DemoScenario = "transient" | "partial" | "permanent";

type DemoState = {
  compensated: boolean;
  approved: boolean;
};

const DEMO_BLOCKERS: Record<Exclude<DemoScenario, "transient">, ResumeBlocker> = {
  partial: {
    classification: "partial",
    step_index: 6,
    step_name: "send_notification",
    failure_key: "6:14",
    message: "Email sent but database write failed",
    required_action: "compensation",
  },
  permanent: {
    classification: "permanent",
    step_index: 2,
    step_name: "validate_credentials",
    failure_key: "2:8",
    message: "Invalid API credentials — rotation required",
    required_action: "human_approval",
  },
};

const SCENARIO_META: Record<
  DemoScenario,
  { label: string; color: string; description: string }
> = {
  transient: {
    label: "Transient",
    color: "text-[#06B6D4]",
    description: "Network timeout — resume immediately, no gates.",
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
  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
      <div className="flex items-start gap-3">
        {isCompensation ? (
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        ) : (
          <Lock className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white font-[Montserrat]">
            {isCompensation ? "Compensation required" : "Human approval required"}
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

export default function OrchestrateOSGatePanel() {
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [mode, setMode] = useState<"demo" | "live">("demo");
  const [scenario, setScenario] = useState<DemoScenario>("partial");
  const [demoState, setDemoState] = useState<DemoState>({ compensated: false, approved: false });
  const [runId, setRunId] = useState("");
  const [liveBlockers, setLiveBlockers] = useState<ResumeBlocker[] | null>(null);
  const [liveCanResume, setLiveCanResume] = useState<boolean | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);

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

  const resetDemo = (next: DemoScenario) => {
    setScenario(next);
    setDemoState({ compensated: false, approved: false });
  };

  const demoCanResume =
    scenario === "transient" ||
    (scenario === "partial" && demoState.compensated) ||
    (scenario === "permanent" && demoState.approved);

  const demoBlockers: ResumeBlocker[] = (() => {
    if (scenario === "transient") return [];
    if (scenario === "partial" && !demoState.compensated) return [DEMO_BLOCKERS.partial];
    if (scenario === "permanent" && !demoState.approved) return [DEMO_BLOCKERS.permanent];
    return [];
  })();

  const lookupRun = async () => {
    const id = runId.trim();
    if (!id) return;
    setLiveLoading(true);
    setLiveError(null);
    try {
      const data = await fetchResumeBlockers(id);
      setLiveBlockers(data.blockers);
      setLiveCanResume(data.can_resume);
    } catch (err) {
      setLiveError(err instanceof Error ? err.message : "Lookup failed");
      setLiveBlockers(null);
      setLiveCanResume(null);
    } finally {
      setLiveLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl border-[#8B5CF6]/15 overflow-hidden">
      {/* Header */}
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

      {/* Mode tabs */}
      <div className="flex border-b border-white/[0.06]">
        {(["demo", "live"] as const).map((tab) => (
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
            {tab === "demo" ? "Interactive demo" : "Live run lookup"}
          </button>
        ))}
      </div>

      <div className="p-6 lg:p-8">
        {mode === "demo" ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(Object.keys(SCENARIO_META) as DemoScenario[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => resetDemo(key)}
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

            {/* Status banner */}
            <div
              className={`rounded-xl p-4 flex items-center gap-3 border ${
                demoCanResume
                  ? "border-emerald-500/25 bg-emerald-500/10"
                  : "border-amber-500/25 bg-amber-500/10"
              }`}
            >
              {demoCanResume ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              )}
              <div>
                <p className="text-sm font-semibold text-white font-[Montserrat]">
                  {demoCanResume ? "Resume allowed" : "Resume blocked"}
                </p>
                <p className="text-xs text-white/50 mt-0.5">
                  {demoCanResume
                    ? "All gates cleared — engine.resume(run_id) may proceed."
                    : "Clear the gate below before calling resume()."}
                </p>
              </div>
            </div>

            {demoBlockers.map((b) => (
              <BlockerCard key={b.failure_key} blocker={b} />
            ))}

            {scenario === "partial" && !demoState.compensated && (
              <button
                type="button"
                onClick={() => setDemoState((s) => ({ ...s, compensated: true }))}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-sm font-semibold hover:bg-amber-500/25 transition-colors"
              >
                <ShieldAlert className="w-4 h-4" />
                Simulate compensation
              </button>
            )}

            {scenario === "permanent" && !demoState.approved && (
              <button
                type="button"
                onClick={() => setDemoState((s) => ({ ...s, approved: true }))}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-200 text-sm font-semibold hover:bg-red-500/20 transition-colors"
              >
                <UserCheck className="w-4 h-4" />
                Simulate operator approval
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-sm text-white/50 leading-relaxed">
              Enter a run ID from your{" "}
              <code className="text-[#06B6D4]">resume_engine</code> deployment to fetch live gate
              status from{" "}
              <code className="text-white/60 text-xs">{orchestrateOSApiBaseUrl()}</code>
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={runId}
                onChange={(e) => setRunId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && lookupRun()}
                placeholder="Run UUID from start_run"
                className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#8B5CF6]/40 font-mono"
              />
              <button
                type="button"
                onClick={lookupRun}
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
            </div>

            {liveError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300/80">
                {liveError.includes("Failed to fetch") || liveError.includes("NetworkError")
                  ? "Could not reach the API. Deploy the control plane or run docker compose locally."
                  : liveError}
              </div>
            )}

            {liveCanResume !== null && !liveError && (
              <>
                <div
                  className={`rounded-xl p-4 flex items-center gap-3 border ${
                    liveCanResume
                      ? "border-emerald-500/25 bg-emerald-500/10"
                      : "border-amber-500/25 bg-amber-500/10"
                  }`}
                >
                  {liveCanResume ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                  )}
                  <p className="text-sm font-semibold text-white font-[Montserrat]">
                    {liveCanResume ? "can_resume: true" : "can_resume: false"}
                  </p>
                </div>
                {liveBlockers?.map((b) => <BlockerCard key={b.failure_key} blocker={b} />)}
                {liveCanResume && liveBlockers?.length === 0 && (
                  <p className="text-sm text-white/45">No active gates on this run.</p>
                )}
              </>
            )}

            {apiOnline === false && (
              <p className="text-xs text-white/30">
                Tip: start the API with{" "}
                <code className="text-white/45">docker compose -f resume_engine/docker-compose.yml up</code>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
