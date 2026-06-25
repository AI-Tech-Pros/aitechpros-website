import { useEffect, useState } from "react";
import { Link } from "wouter";
import OrchestrateOSNavbar from "@/components/OrchestrateOSNavbar";
import AdminRoute from "@/components/AdminRoute";
import {
  fetchAdminIngressQueue,
  fetchAdminOpsSummary,
  type IngressEvent,
  type OpsSummary,
} from "@/lib/platform-api";

function OpsContent() {
  const [summary, setSummary] = useState<OpsSummary | null>(null);
  const [ingress, setIngress] = useState<IngressEvent[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const [s, q] = await Promise.all([fetchAdminOpsSummary(), fetchAdminIngressQueue()]);
        setSummary(s);
        setIngress(q.events);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load ops data");
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0D17]">
      <OrchestrateOSNavbar />
      <main className="container max-w-5xl pt-28 pb-16 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white font-[Montserrat]">Ops console</h1>
          <p className="text-white/50 text-sm mt-2">
            Phase D surfaces — ingress queue, blocked runs, nurture backlog. Observer alerts fire on gate
            block via <code className="text-[#06B6D4] text-xs">OBSERVER_WEBHOOK_URL</code> or email.
          </p>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {summary && (
          <div className="grid sm:grid-cols-4 gap-3">
            {[
              { label: "Ingress pending", value: summary.ingress_pending },
              { label: "Ingress failed", value: summary.ingress_failed },
              { label: "Runs blocked", value: summary.runs_blocked_total },
              { label: "Nurture active", value: summary.nurture_pending },
            ].map((item) => (
              <div key={item.label} className="glass-card rounded-xl p-4">
                <p className="text-xs text-white/40">{item.label}</p>
                <p className="text-2xl font-mono text-white mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        )}

        <section className="glass-card rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <h2 className="text-white font-medium">Ingress queue (recent)</h2>
            <p className="text-xs text-white/40 mt-1">
              Drained every 10 minutes by cron · manual{" "}
              <code className="text-[#06B6D4]">POST /ingress/queue/process</code>
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/40 border-b border-white/[0.06]">
                  <th className="p-3">Status</th>
                  <th className="p-3">Tenant</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Run</th>
                  <th className="p-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {ingress.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-white/40">
                      No ingress events
                    </td>
                  </tr>
                ) : (
                  ingress.map((ev) => (
                    <tr key={ev.id} className="border-b border-white/[0.04] text-white/70">
                      <td className="p-3 font-mono text-xs">{ev.status}</td>
                      <td className="p-3">{ev.tenant_id}</td>
                      <td className="p-3">{ev.source}</td>
                      <td className="p-3 font-mono text-xs">{ev.run_id ?? "—"}</td>
                      <td className="p-3 text-xs text-white/40">{ev.created_at}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <p className="text-sm text-white/40">
          Optimizer: apply advisory retry policy with{" "}
          <code className="text-[#06B6D4] text-xs">POST /runs/:id/retry_policy/apply</code> after a kernel
          run. Auditor digest runs on daily nurture cron when blocked runs exist.
        </p>

        <Link href="/admin/capture" className="text-[#06B6D4] text-sm hover:underline">
          ← Admin capture
        </Link>
      </main>
    </div>
  );
}

export default function OrchestrateOSAdminOps() {
  return (
    <AdminRoute>
      <OpsContent />
    </AdminRoute>
  );
}
