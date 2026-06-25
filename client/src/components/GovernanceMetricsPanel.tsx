import { useEffect, useState } from "react";
import { Activity, Clock, Shield, Users } from "lucide-react";
import { fetchPartnerGovernanceMetrics, type GovernanceMetrics } from "@/lib/platform-api";

export default function GovernanceMetricsPanel() {
  const [metrics, setMetrics] = useState<GovernanceMetrics | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        setMetrics(await fetchPartnerGovernanceMetrics());
      } catch {
        setError("Governance metrics unavailable.");
      }
    })();
  }, []);

  if (error) return null;
  if (!metrics) {
    return <p className="text-xs text-white/40">Loading governance metrics…</p>;
  }

  const topEvents = Object.entries(metrics.gate_event_breakdown).slice(0, 4);

  return (
    <div className="rounded-xl border border-[#8B5CF6]/25 bg-[#8B5CF6]/5 p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#8B5CF6]" />
          Governance analytics (30d)
        </h3>
        <p className="text-xs text-white/40 mt-1">Gate activity and clearance times for your tenant.</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="rounded-lg bg-black/30 border border-white/10 px-3 py-2">
          <p className="text-white/40 flex items-center gap-1"><Shield className="w-3 h-3" /> Blocked runs</p>
          <p className="text-white font-mono text-lg">{metrics.runs_blocked}</p>
        </div>
        <div className="rounded-lg bg-black/30 border border-white/10 px-3 py-2">
          <p className="text-white/40">Gate events</p>
          <p className="text-white font-mono text-lg">{metrics.gate_events_30d}</p>
        </div>
        <div className="rounded-lg bg-black/30 border border-white/10 px-3 py-2">
          <p className="text-white/40">Gate clears</p>
          <p className="text-white font-mono text-lg">{metrics.gate_clears_30d}</p>
        </div>
        <div className="rounded-lg bg-black/30 border border-white/10 px-3 py-2">
          <p className="text-white/40 flex items-center gap-1"><Clock className="w-3 h-3" /> Avg clear</p>
          <p className="text-white font-mono text-lg">
            {metrics.avg_clear_hours !== null ? `${metrics.avg_clear_hours}h` : "—"}
          </p>
        </div>
      </div>
      {topEvents.length > 0 && (
        <div className="text-xs text-white/50">
          <p className="text-white/40 mb-1">Event breakdown</p>
          <ul className="space-y-1 font-mono">
            {topEvents.map(([type, count]) => (
              <li key={type}>{type}: {count}</li>
            ))}
          </ul>
        </div>
      )}
      {metrics.recent_approvers.length > 0 && (
        <p className="text-xs text-white/45 flex items-center gap-1">
          <Users className="w-3 h-3" />
          Recent approvers: {metrics.recent_approvers.join(", ")}
        </p>
      )}
    </div>
  );
}
