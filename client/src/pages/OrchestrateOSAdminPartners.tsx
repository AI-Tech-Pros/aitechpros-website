import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import AdminRoute from "@/components/AdminRoute";
import {
  createAdminPartner,
  DEFAULT_TENANT_GATE_POLICY,
  fetchAdminPartnerGatePolicy,
  fetchAdminPartners,
  provisionAdminPartnerRunnerKey,
  updateAdminPartner,
  updateAdminPartnerGatePolicy,
  type AdminPartner,
  type PartnerPhase,
  type PartnerStatus,
  type TenantGatePolicy,
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
  const [revealedKey, setRevealedKey] = useState("");
  const [provisioningId, setProvisioningId] = useState("");
  const [gatePolicy, setGatePolicy] = useState<TenantGatePolicy>(DEFAULT_TENANT_GATE_POLICY);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policySaving, setPolicySaving] = useState(false);
  const [policyNote, setPolicyNote] = useState("");

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
    setGatePolicy(DEFAULT_TENANT_GATE_POLICY);
    setPolicyNote("");
    setShowForm(true);
  };

  const openEdit = async (partner: AdminPartner) => {
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
    setPolicyNote("");
    setShowForm(true);
    setPolicyLoading(true);
    try {
      const { policy } = await fetchAdminPartnerGatePolicy(partner.id);
      setGatePolicy(policy);
    } catch {
      setGatePolicy(DEFAULT_TENANT_GATE_POLICY);
      setPolicyNote("Could not load gate policy — showing defaults.");
    } finally {
      setPolicyLoading(false);
    }
  };

  const provisionKey = async (partner: AdminPartner, rotate = false) => {
    setError("");
    setKeyNote("");
    setRevealedKey("");
    setProvisioningId(partner.id);
    try {
      const result = await provisionAdminPartnerRunnerKey(partner.id, { rotate });
      if (result.runner_api_key) setRevealedKey(result.runner_api_key);
      if (result.runner_key_note) setKeyNote(result.runner_key_note);
      if (result.message && !result.runner_api_key) setKeyNote(result.message);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not provision runner key");
    } finally {
      setProvisioningId("");
    }
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
        if (result.runner_api_key) setRevealedKey(result.runner_api_key);
      }
      if (!editing) {
        setShowForm(false);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  };

  const saveGatePolicy = async () => {
    if (!editing) return;
    setPolicySaving(true);
    setPolicyNote("");
    setError("");
    try {
      const result = await updateAdminPartnerGatePolicy(editing.id, gatePolicy);
      setGatePolicy(result.policy);
      setPolicyNote(`Gate policy saved for tenant ${result.tenant_id}. Applies on new start_run calls.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save gate policy");
    } finally {
      setPolicySaving(false);
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

          {editing && (
            <div className="rounded-xl border border-[#8B5CF6]/25 bg-[#8B5CF6]/5 p-4 space-y-4">
              <div>
                <h3 className="text-white font-medium text-sm">Gate policy</h3>
                <p className="text-xs text-white/40 mt-1">
                  Applied automatically when this tenant calls{" "}
                  <code className="text-[#06B6D4]">start_run</code>. Tenant:{" "}
                  <code className="text-white/50">{editing.slug}</code>
                </p>
              </div>
              {policyLoading ? (
                <p className="text-xs text-white/40">Loading policy…</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 text-sm text-white/70">
                    <input
                      type="checkbox"
                      checked={gatePolicy.prod_requires_ack}
                      onChange={(e) =>
                        setGatePolicy({ ...gatePolicy, prod_requires_ack: e.target.checked })
                      }
                      className="rounded border-white/20"
                    />
                    Require prod resume acknowledgment
                  </label>
                  <label className="flex items-center gap-2 text-sm text-white/70">
                    <input
                      type="checkbox"
                      checked={gatePolicy.partial_requires_compensation}
                      onChange={(e) =>
                        setGatePolicy({
                          ...gatePolicy,
                          partial_requires_compensation: e.target.checked,
                        })
                      }
                      className="rounded border-white/20"
                    />
                    Partial failures require compensation
                  </label>
                  <label className="block text-sm sm:col-span-2">
                    <span className="text-white/40">Permanent failure consensus reviewers (0 = single approver)</span>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      className="mt-1 w-full max-w-xs rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white text-sm font-mono"
                      value={gatePolicy.permanent_consensus_min}
                      onChange={(e) =>
                        setGatePolicy({
                          ...gatePolicy,
                          permanent_consensus_min: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                    />
                  </label>
                </div>
              )}
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  type="button"
                  onClick={() => void saveGatePolicy()}
                  disabled={policySaving || policyLoading}
                  className="px-3 py-1.5 text-xs rounded-lg border border-[#8B5CF6]/40 text-[#c4b5fd] disabled:opacity-50"
                >
                  {policySaving ? "Saving policy…" : "Save gate policy"}
                </button>
                {policyNote && <span className="text-xs text-[#06B6D4]">{policyNote}</span>}
              </div>
            </div>
          )}

          {keyNote && (
            <p className="text-xs text-[#06B6D4] font-mono bg-black/40 p-3 rounded-lg">{keyNote}</p>
          )}
          {revealedKey && (
            <pre className="text-xs text-amber-200 font-mono bg-black/40 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
              {revealedKey}
            </pre>
          )}
          <p className="text-xs text-white/30">
            Runner keys are auto-issued on create. Use &quot;Issue key&quot; to backfill legacy partners.
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
                  <th className="p-4 font-medium">Key</th>
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
                      {partner.runner_api_key_hint ? (
                        <code className="text-xs text-white/40">{partner.runner_api_key_hint}</code>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void provisionKey(partner)}
                          disabled={provisioningId === partner.id}
                          className="text-xs text-amber-300 hover:text-amber-200 disabled:opacity-50"
                        >
                          {provisioningId === partner.id ? "Issuing…" : "Issue key"}
                        </button>
                      )}
                    </td>
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => void openEdit(partner)}
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
