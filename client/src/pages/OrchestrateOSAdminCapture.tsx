import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import AdminRoute from "@/components/AdminRoute";
import {
  deleteAdminLead,
  fetchAdminLeads,
  upsertAdminLead,
  type AdminLead,
  type LeadStage,
} from "@/lib/platform-api";

const STAGES: (LeadStage | "all")[] = ["all", "new", "engaged", "qualified", "converted"];

const emptyForm = {
  name: "",
  email: "",
  company: "",
  use_case: "",
  stage: "new" as LeadStage,
  source: "admin",
};

function CaptureContent() {
  const [filter, setFilter] = useState<LeadStage | "all">("all");
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<AdminLead | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminLeads(filter === "all" ? undefined : filter);
      setLeads(data.leads);
    } catch {
      setError("Could not load leads.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (lead: AdminLead) => {
    setEditing(lead);
    setForm({
      name: lead.name,
      email: lead.email,
      company: lead.company ?? "",
      use_case: lead.use_case ?? "",
      stage: lead.stage as LeadStage,
      source: lead.source,
    });
    setShowForm(true);
  };

  const save = async () => {
    setError("");
    try {
      await upsertAdminLead({
        id: editing?.id,
        name: form.name,
        email: form.email,
        company: form.company || undefined,
        use_case: form.use_case || undefined,
        stage: form.stage,
        source: form.source,
      });
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this lead?")) return;
    setError("");
    try {
      await deleteAdminLead(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <AdminLayout title="Lead capture">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {STAGES.map((stage) => (
            <button
              key={stage}
              type="button"
              onClick={() => setFilter(stage)}
              className={`px-3 py-1.5 text-xs rounded-lg capitalize ${
                filter === stage
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {stage}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20"
        >
          <Plus className="w-4 h-4" />
          Add lead
        </button>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {showForm && (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 mb-6 space-y-4">
          <h2 className="text-white font-semibold">{editing ? "Edit lead" : "New lead"}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="text-white/40">Name</span>
              <input
                className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white text-sm"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/40">Email</span>
              <input
                type="email"
                className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white text-sm"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/40">Company</span>
              <input
                className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white text-sm"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/40">Stage</span>
              <select
                className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white text-sm"
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: e.target.value as LeadStage })}
              >
                {STAGES.filter((s) => s !== "all").map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-white/40">Use case</span>
            <textarea
              className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white text-sm min-h-[80px]"
              value={form.use_case}
              onChange={(e) => setForm({ ...form, use_case: e.target.value })}
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void save()}
              className="px-4 py-2 text-sm rounded-lg bg-[#06B6D4] text-black font-medium"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-white/50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
        {loading ? (
          <p className="p-6 text-white/50 text-sm">Loading…</p>
        ) : leads.length === 0 ? (
          <p className="p-6 text-white/50 text-sm">No leads in this stage.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/40 border-b border-white/[0.06]">
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Company</th>
                  <th className="p-4 font-medium">Stage</th>
                  <th className="p-4 font-medium">Created</th>
                  <th className="p-4 font-medium w-24" />
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-white/[0.04] text-white/80">
                    <td className="p-4">{lead.name}</td>
                    <td className="p-4 font-mono text-xs">{lead.email}</td>
                    <td className="p-4">{lead.company ?? "—"}</td>
                    <td className="p-4 capitalize">{lead.stage}</td>
                    <td className="p-4 text-white/40 text-xs">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(lead)}
                          className="text-white/40 hover:text-[#06B6D4]"
                          aria-label="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void remove(lead.id)}
                          className="text-white/40 hover:text-red-400"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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

export default function OrchestrateOSAdminCapture() {
  return (
    <AdminRoute>
      <CaptureContent />
    </AdminRoute>
  );
}
