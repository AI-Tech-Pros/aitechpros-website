import { useCallback, useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import AdminRoute from "@/components/AdminRoute";
import { fetchAdminOutcomes, type AdminOutcome } from "@/lib/platform-api";
import { orchestrateOSApiBaseUrl } from "@/lib/site";

function OutcomesContent() {
  const [outcomes, setOutcomes] = useState<AdminOutcome[]>([]);
  const [tenantFilter, setTenantFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const api = orchestrateOSApiBaseUrl();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminOutcomes(tenantFilter.trim() || undefined);
      setOutcomes(data.outcomes);
    } catch {
      setError("Could not load outcomes.");
    } finally {
      setLoading(false);
    }
  }, [tenantFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const tenants = Array.from(new Set(outcomes.map((o) => o.tenant_id))).sort();

  return (
    <AdminLayout title="Outcomes">
      <p className="text-white/50 text-sm mb-6">
        Real workflow runs from D1 — joined with design partners. Demo runs excluded.
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          className="rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white text-sm font-mono w-48"
          placeholder="Filter tenant…"
          value={tenantFilter}
          onChange={(e) => setTenantFilter(e.target.value)}
        />
        <button
          type="button"
          onClick={() => void load()}
          className="px-4 py-2 text-sm rounded-lg bg-white/5 text-white/70 hover:text-white"
        >
          Apply
        </button>
        {tenants.length > 0 && !tenantFilter && (
          <div className="flex flex-wrap gap-2 items-center">
            {tenants.slice(0, 8).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTenantFilter(t)}
                className="px-2 py-1 text-xs rounded-md bg-[#06B6D4]/10 text-[#06B6D4] font-mono"
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
        {loading ? (
          <p className="p-6 text-white/50 text-sm">Loading…</p>
        ) : outcomes.length === 0 ? (
          <p className="p-6 text-white/50 text-sm">No partner runs yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/40 border-b border-white/[0.06]">
                  <th className="p-4 font-medium">Run</th>
                  <th className="p-4 font-medium">Partner</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Gates</th>
                  <th className="p-4 font-medium">Env</th>
                  <th className="p-4 font-medium">Journey</th>
                  <th className="p-4 font-medium">Links</th>
                </tr>
              </thead>
              <tbody>
                {outcomes.map((row) => (
                  <tr key={row.run_id} className="border-b border-white/[0.04] text-white/80">
                    <td className="p-4">
                      <p className="font-mono text-xs break-all max-w-[200px]">{row.run_id}</p>
                      <p className="text-white/50 text-xs mt-1">{row.workflow_name}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-mono text-xs text-[#06B6D4]">{row.tenant_id}</p>
                      <p className="text-white/40 text-xs">{row.partner_company ?? "—"}</p>
                    </td>
                    <td className="p-4 capitalize">{row.status}</td>
                    <td className="p-4">
                      {row.status === "failed" || row.status === "paused" ? (
                        row.blocker_count > 0 ? (
                          <span className="text-amber-400 text-xs">
                            {row.blocker_count} blocker{row.blocker_count > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="text-emerald-400 text-xs">Can resume</span>
                        )
                      ) : (
                        <span className="text-white/30 text-xs">{row.steps_completed} steps</span>
                      )}
                    </td>
                    <td className="p-4 uppercase text-xs">{row.environment}</td>
                    <td className="p-4 text-xs text-white/40">
                      {row.journey.checklist_completed && <span className="block">✓ checklist</span>}
                      {row.journey.first_workflow_at && (
                        <span className="block font-mono">
                          {new Date(row.journey.first_workflow_at).toLocaleDateString()}
                        </span>
                      )}
                      {!row.journey.checklist_completed && !row.journey.first_workflow_at && "—"}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <a
                          href="/#gates"
                          onClick={(e) => {
                            e.preventDefault();
                            sessionStorage.setItem("orchestrateos_run_id", row.run_id);
                            window.location.href = "/#gates";
                          }}
                          className="text-xs text-[#06B6D4] hover:underline"
                        >
                          Gates
                        </a>
                        <a
                          href={`${api}/runs/${row.run_id}/audit_events`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-white/50 hover:text-white inline-flex items-center gap-1"
                        >
                          Audit
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <a
                          href={`${api}/runs/${row.run_id}/replay`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-white/50 hover:text-white inline-flex items-center gap-1"
                        >
                          Replay
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminLayout>
  );
}

export default function OrchestrateOSAdminOutcomes() {
  return (
    <AdminRoute>
      <OutcomesContent />
    </AdminRoute>
  );
}
