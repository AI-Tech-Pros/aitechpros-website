import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Circle, Loader2, Shield } from "lucide-react";
import {
  fetchComplianceExport,
  type ComplianceExport,
} from "@/lib/orchestrateos-api";
import { fetchPartnerComplianceExport } from "@/lib/platform-api";

type TimelineEntry = {
  id: string;
  at: string;
  kind: "step" | "audit" | "gate";
  title: string;
  detail?: string;
  tone: "neutral" | "success" | "warning" | "danger";
};

function toneForStep(status: string, classification?: string | null): TimelineEntry["tone"] {
  if (status === "completed") return "success";
  if (status === "failed") {
    if (classification === "permanent") return "danger";
    return "warning";
  }
  return "neutral";
}

function buildTimeline(exportData: ComplianceExport): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  for (const step of exportData.steps) {
    entries.push({
      id: `step-${step.sequence}`,
      at: step.timestamp,
      kind: "step",
      title: `Step ${step.step_index + 1}: ${step.step_name}`,
      detail: `${step.status}${step.failure_classification ? ` · ${step.failure_classification}` : ""}`,
      tone: toneForStep(step.status, step.failure_classification),
    });
  }

  for (const event of exportData.audit_events) {
    const isGate = /gate\.|compensat|approv|consensus|prod/.test(event.event_type);
    entries.push({
      id: `audit-${event.created_at}-${event.event_type}`,
      at: event.created_at,
      kind: isGate ? "gate" : "audit",
      title: event.event_type,
      detail: event.actor ? `by ${event.actor}` : undefined,
      tone: isGate ? "warning" : "neutral",
    });
  }

  return entries.sort((a, b) => a.at.localeCompare(b.at));
}

const toneClasses: Record<TimelineEntry["tone"], string> = {
  neutral: "border-white/10 bg-white/[0.02]",
  success: "border-emerald-500/25 bg-emerald-500/5",
  warning: "border-amber-500/25 bg-amber-500/5",
  danger: "border-red-500/25 bg-red-500/5",
};

type Props = {
  runId: string;
  /** Session-based partner export when true; otherwise API key / demo. */
  partnerSession?: boolean;
  compact?: boolean;
};

export default function RunTimeline({ runId, partnerSession = false, compact = false }: Props) {
  const [data, setData] = useState<ComplianceExport | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!runId.trim()) return;
    setLoading(true);
    setError("");
    try {
      const bundle = partnerSession
        ? await fetchPartnerComplianceExport(runId)
        : await fetchComplianceExport(runId);
      setData(bundle);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load run timeline");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [runId, partnerSession]);

  useEffect(() => {
    void load();
  }, [load]);

  const entries = useMemo(() => (data ? buildTimeline(data) : []), [data]);

  if (loading) {
    return (
      <p className="text-sm text-white/40 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading run timeline…
      </p>
    );
  }

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>;
  }

  if (!data) return null;

  return (
    <section className={compact ? "space-y-3" : "rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-4"}>
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-white font-semibold font-[Montserrat]">Run timeline</h3>
            <p className="text-xs text-white/45 mt-1 font-mono">{data.run.run_id}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span
              className={`px-2 py-1 rounded border ${
                data.gate_summary.can_resume
                  ? "border-emerald-500/30 text-emerald-300"
                  : "border-amber-500/30 text-amber-200"
              }`}
            >
              {data.gate_summary.can_resume ? "Resume allowed" : `${data.gate_summary.blocker_count} blocker(s)`}
            </span>
            <span className="px-2 py-1 rounded border border-white/10 text-white/50">
              {data.integrity.step_count} steps · {data.integrity.audit_event_count} audit events
            </span>
          </div>
        </div>
      )}

      {!data.idempotency_analysis.side_effect_safe && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{data.idempotency_analysis.summary}</span>
        </div>
      )}

      <ol className="relative border-l border-white/10 ml-2 space-y-3">
        {entries.map((entry) => (
          <li key={entry.id} className="ml-4 pl-4 relative">
            <span className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-[#0B0D17] border border-white/20 flex items-center justify-center">
              {entry.kind === "gate" ? (
                <Shield className="w-2 h-2 text-amber-400" />
              ) : entry.tone === "success" ? (
                <CheckCircle2 className="w-2 h-2 text-emerald-400" />
              ) : (
                <Circle className="w-2 h-2 text-white/30" />
              )}
            </span>
            <div className={`rounded-lg border px-3 py-2 ${toneClasses[entry.tone]}`}>
              <p className="text-sm text-white/85">{entry.title}</p>
              {entry.detail && <p className="text-xs text-white/45 mt-0.5">{entry.detail}</p>}
              <p className="text-[10px] text-white/30 font-mono mt-1">{entry.at}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
