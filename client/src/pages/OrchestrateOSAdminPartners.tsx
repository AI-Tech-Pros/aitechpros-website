import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import AdminRoute from "@/components/AdminRoute";
import {
  createAdminPartner,
  fetchAdminPartners,
  updateAdminPartner,
  type AdminPartner,
  type PartnerPhase,
  type PartnerStatus,
} from "@/lib/platform-api";

const PHASES: PartnerPhase[] = ["discovery", "build", "review", "complete"];
const STATUSES: PartnerStatus[] = ["active", "paused", "complete"];

const emptyForm = {
  company_name: "",
  contact_email: "",
  slug: "",
  phase: "discovery" as PartnerPhase,
  status: "active" as PartnerStatus,
  milestone: "",
  runner_api_key_hint: "",
};

function PartnersContent() {
  const [partners, setPartners] = useState<AdminPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<AdminPartner | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [keyNote, setKeyNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminPartners();
      setPartners(data.partners);
    } catch {
      setError("Could not load partners.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setKeyNote("");
    setShowForm(true);
  };

  const openEdit = (partner: AdminPartner) => {
    setEditing(partner);
    setForm({
      company_name: partner.company_name,
      contact_email: partner.contact_email,
      slug: partner.slug,
      phase: partner.phase as PartnerPhase,
      status: partner.status as PartnerStatus,
      milestone: partner.milestone ?? "",
      runner_api_key_hint: partner.runner_api_key_hint ?? "",
    });
    setKeyNote("");
    setShowForm(true);
  };

  const save = async () => {
    setError("");
    setKeyNote("");
    try {
      if (editing) {
        await updateAdminPartner({
          id: editing.id,
          company_name: form.company_name,
          contact_email: form.contact_email,
          phase: form.phase,
          status: form.status,
          milestone: form.milestone || undefined,
          runner_api_key_hint: form.runner_api_key_hint || undefined,
        });
      } else {
        const result = await createAdminPartner({
          company_name: form.company_name,
          contact_email: form.contact_email,
          slug: form.slug || undefined,
          phase: form.phase,
          status: form.status,
          milestone: form.milestone || undefined,
          runner_api_key_hint: form.runner_api_key_hint || undefined,
        });
        if (result.runner_key_note) setKeyNote(result.runner_key_note);
      }
      if (!editing) {
        setShowForm(false);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  };

  return (
    <AdminLayout title="Design partners">
      <div className="flex justify-end mb-6">
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20"
        >
          <Plus className="w-4 h-4" />
          Add partner
        </button>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {showForm && (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 mb-6 space-y-4">
          <h2 className="text-white font-semibold">{editing ? "Edit partner" : "New partner"}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="text-white/40">Company</span>
              <input
                className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white text-sm"
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/40">Contact email</span>
              <input
                type="email"
                className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white text-sm"
                value={form.contact_email}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              />
            </label>
            {!editing && (
              <label className="block text-sm">
                <span className="text-white/40">Slug (optional)</span>
                <input
                  className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white text-sm font-mono"
                  placeholder="auto from company name"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
              </label>
            )}
            {editing && (
              <label className="block text-sm">
                <span className="text-white/40">Tenant slug</span>
                <input
                  className="mt-1 w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-white/50 text-sm font-mono"
                  value={form.slug}
                  disabled
                />
              </label>
            )}
            <label className="block text-sm">
              <span className="text-white/40">Phase</span>
              <select
                className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white text-sm"
                value={form.phase}
                onChange={(e) => setForm({ ...form, phase: e.target.value as PartnerPhase })}
              >
                {PHASES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-white/40">Status</span>
              <select
                className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white text-sm"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as PartnerStatus })}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-white/40">Milestone</span>
              <input
                className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white text-sm"
                value={form.milestone}
                onChange={(e) => setForm({ ...form, milestone: e.target.value })}
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-white/40">Runner API key hint</span>
              <input
                className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white text-sm font-mono"
                placeholder="e.g. last 8 chars of issued key"
                value={form.runner_api_key_hint}
                onChange={(e) => setForm({ ...form, runner_api_key_hint: e.target.value })}
              />
            </label>
          </div>
          {keyNote && (
            <p className="text-xs text-[#06B6D4] font-mono bg-black/40 p-3 rounded-lg">{keyNote}</p>
          )}
          <p className="text-xs text-white/30">
            Issue runner keys via{" "}
            <code className="text-white/50">wrangler secret put API_KEYS_JSON</code> with tenant
            matching the partner slug.
          </p>
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
        ) : partners.length === 0 ? (
          <p className="p-6 text-white/50 text-sm">No design partners yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/40 border-b border-white/[0.06]">
                  <th className="p-4 font-medium">Company</th>
                  <th className="p-4 font-medium">Slug</th>
                  <th className="p-4 font-medium">Contact</th>
                  <th className="p-4 font-medium">Phase</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Milestone</th>
                  <th className="p-4 font-medium w-12" />
                </tr>
              </thead>
              <tbody>
                {partners.map((partner) => (
                  <tr key={partner.id} className="border-b border-white/[0.04] text-white/80">
                    <td className="p-4">{partner.company_name}</td>
                    <td className="p-4 font-mono text-xs text-[#06B6D4]">{partner.slug}</td>
                    <td className="p-4 font-mono text-xs">{partner.contact_email}</td>
                    <td className="p-4 capitalize">{partner.phase}</td>
                    <td className="p-4 capitalize">{partner.status}</td>
                    <td className="p-4 text-white/50">{partner.milestone ?? "—"}</td>
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => openEdit(partner)}
                        className="text-white/40 hover:text-[#06B6D4]"
                        aria-label="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
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

export default function OrchestrateOSAdminPartners() {
  return (
    <AdminRoute>
      <PartnersContent />
    </AdminRoute>
  );
}
