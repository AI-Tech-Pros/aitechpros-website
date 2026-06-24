import { useCallback, useEffect, useState } from "react";
import { Download, FileJson, Loader2, ShieldCheck } from "lucide-react";
import {
  downloadComplianceExport,
  fetchComplianceExport,
  type ComplianceExport,
} from "@/lib/orchestrateos-api";
import { downloadPartnerComplianceExport, fetchPartnerComplianceExport } from "@/lib/platform-api";

type Props = {
  runId: string;
  partnerSession?: boolean;
  className?: string;
};

export default function ComplianceExportPanel({ runId, partnerSession = false, className = "" }: Props) {
  const [data, setData] = useState<ComplianceExport | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

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
      setError(e instanceof Error ? e.message : "Export unavailable");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [runId, partnerSession]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDownload() {
    setDownloading(true);
    setError("");
    try {
      if (partnerSession) {
        await downloadPartnerComplianceExport(runId);
      } else {
        await downloadComplianceExport(runId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className={`rounded-xl border border-[#06B6D4]/20 bg-[#06B6D4]/5 p-4 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white flex items-center gap-2">
            <FileJson className="w-4 h-4 text-[#06B6D4]" />
            Compliance export
          </p>
          <p className="text-xs text-white/45 mt-1">
            JSON bundle: steps, gates, audit trail, replay payload, idempotency analysis.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={downloading || loading || !runId.trim()}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#06B6D4] text-[#0B0D17] text-xs font-semibold disabled:opacity-50"
        >
          {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          Download JSON
        </button>
      </div>

      {loading && <p className="text-xs text-white/40 mt-3">Loading export preview…</p>}
      {error && <p className="text-xs text-red-400 mt-3">{error}</p>}

      {data && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="rounded-lg bg-black/30 border border-white/10 px-3 py-2">
            <p className="text-white/40">Steps</p>
            <p className="text-white font-mono">{data.integrity.step_count}</p>
          </div>
          <div className="rounded-lg bg-black/30 border border-white/10 px-3 py-2">
            <p className="text-white/40">Audit events</p>
            <p className="text-white font-mono">{data.integrity.audit_event_count}</p>
          </div>
          <div className="rounded-lg bg-black/30 border border-white/10 px-3 py-2">
            <p className="text-white/40">Replay steps</p>
            <p className="text-white font-mono">{data.replay.step_count}</p>
          </div>
          <div
            className={`rounded-lg border px-3 py-2 ${
              data.idempotency_analysis.side_effect_safe
                ? "bg-emerald-500/10 border-emerald-500/25"
                : "bg-amber-500/10 border-amber-500/25"
            }`}
          >
            <p className="text-white/40 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Idempotency
            </p>
            <p className={data.idempotency_analysis.side_effect_safe ? "text-emerald-300" : "text-amber-200"}>
              {data.idempotency_analysis.side_effect_safe ? "Clear" : "Review"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
