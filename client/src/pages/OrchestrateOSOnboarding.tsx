import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import OrchestrateOSNavbar from "@/components/OrchestrateOSNavbar";
import { submitPartnerOnboard } from "@/lib/platform-api";
import { slugifyPreview } from "@/lib/slugify";

type Step = 1 | 2 | 3;

const steps: { n: Step; label: string }[] = [
  { n: 1, label: "Company" },
  { n: 2, label: "Team" },
  { n: 3, label: "Confirm" },
];

export default function OrchestrateOSOnboarding() {
  const [step, setStep] = useState<Step>(1);
  const [companyName, setCompanyName] = useState("");
  const [slug, setSlug] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [teamEmails, setTeamEmails] = useState("");
  const [useCase, setUseCase] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    tenant_id: string;
    runner_key_note: string;
    magic_link_sent: boolean;
    message: string;
  } | null>(null);

  const tenantPreview = useMemo(() => {
    const base = slug.trim() || companyName.trim();
    return base ? slugifyPreview(base) : "";
  }, [slug, companyName]);

  const canNext =
    (step === 1 && companyName.trim().length > 1) ||
    (step === 2 && contactName.trim() && contactEmail.includes("@"));

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const data = await submitPartnerOnboard({
        company_name: companyName.trim(),
        contact_name: contactName.trim(),
        contact_email: contactEmail.trim(),
        team_emails: teamEmails,
        slug: slug.trim() || undefined,
        use_case: useCase.trim() || undefined,
      });
      setResult({
        tenant_id: data.tenant_id,
        runner_key_note: data.runner_key_note,
        magic_link_sent: data.magic_link_sent,
        message: data.message,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Onboarding failed");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="min-h-screen bg-[#0B0D17]">
        <OrchestrateOSNavbar />
        <main className="container max-w-lg pt-28 pb-16">
          <div className="rounded-2xl border border-[#06B6D4]/20 bg-[#06B6D4]/5 p-8">
            <div className="w-12 h-12 rounded-full bg-[#06B6D4]/20 flex items-center justify-center mb-4">
              <Check className="w-6 h-6 text-[#06B6D4]" />
            </div>
            <h1 className="text-2xl font-bold text-white font-[Montserrat] mb-2">You&apos;re onboarded</h1>
            <p className="text-white/60 text-sm mb-6">{result.message}</p>
            <dl className="space-y-3 text-sm mb-6">
              <div>
                <dt className="text-white/40">Tenant ID</dt>
                <dd className="text-[#06B6D4] font-mono">{result.tenant_id}</dd>
              </div>
              <div>
                <dt className="text-white/40">Runner API key</dt>
                <dd className="text-white/70 font-mono text-xs break-all bg-black/40 p-3 rounded-lg mt-1">
                  {result.runner_key_note}
                </dd>
                <p className="text-white/30 text-xs mt-2">
                  Your AI Tech Pros contact will add this to{" "}
                  <code className="text-white/50">API_KEYS_JSON</code> via wrangler. See{" "}
                  <Link href="/install" className="text-[#06B6D4] hover:underline">
                    /install
                  </Link>
                  .
                </p>
              </div>
            </dl>
            <Link
              href="/login"
              className="inline-block px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white text-sm font-semibold"
            >
              {result.magic_link_sent ? "Open sign-in" : "Partner sign in"}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0D17]">
      <OrchestrateOSNavbar />
      <main className="container max-w-lg pt-28 pb-16">
        <h1 className="text-2xl font-bold text-white font-[Montserrat] mb-2">Design partner onboarding</h1>
        <p className="text-white/50 text-sm mb-8">
          Set up your tenant, invite your team, and get a magic link to the partner dashboard.
        </p>

        <div className="flex gap-2 mb-8">
          {steps.map((s) => (
            <div
              key={s.n}
              className={`flex-1 text-center py-2 text-xs rounded-lg border ${
                step === s.n
                  ? "border-[#06B6D4]/30 text-[#06B6D4] bg-[#06B6D4]/5"
                  : step > s.n
                    ? "border-white/10 text-white/50"
                    : "border-white/[0.06] text-white/25"
              }`}
            >
              {s.label}
            </div>
          ))}
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {step === 1 && (
          <div className="space-y-4">
            <label className="block text-sm">
              <span className="text-white/40">Company name</span>
              <input
                className="mt-1 w-full rounded-xl bg-black/40 border border-white/[0.08] px-4 py-3 text-white text-sm"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Robotics"
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/40">Tenant slug (optional)</span>
              <input
                className="mt-1 w-full rounded-xl bg-black/40 border border-white/[0.08] px-4 py-3 text-white text-sm font-mono"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto-generated if blank"
              />
              {tenantPreview && (
                <p className="mt-2 text-xs text-white/30">
                  Preview: <span className="text-[#06B6D4] font-mono">{tenantPreview}</span>
                </p>
              )}
            </label>
            <label className="block text-sm">
              <span className="text-white/40">Primary workflow / use case</span>
              <textarea
                className="mt-1 w-full rounded-xl bg-black/40 border border-white/[0.08] px-4 py-3 text-white text-sm min-h-[80px]"
                value={useCase}
                onChange={(e) => setUseCase(e.target.value)}
                placeholder="LangGraph claims pipeline with human approval gates…"
              />
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <label className="block text-sm">
              <span className="text-white/40">Primary contact name</span>
              <input
                className="mt-1 w-full rounded-xl bg-black/40 border border-white/[0.08] px-4 py-3 text-white text-sm"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/40">Primary contact email</span>
              <input
                type="email"
                className="mt-1 w-full rounded-xl bg-black/40 border border-white/[0.08] px-4 py-3 text-white text-sm"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/40">Additional team emails (optional)</span>
              <textarea
                className="mt-1 w-full rounded-xl bg-black/40 border border-white/[0.08] px-4 py-3 text-white text-sm min-h-[80px] font-mono text-xs"
                value={teamEmails}
                onChange={(e) => setTeamEmails(e.target.value)}
                placeholder="one per line or comma-separated"
              />
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-white/40">Company</span>
              <span className="text-white">{companyName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Tenant</span>
              <span className="text-[#06B6D4] font-mono">{tenantPreview || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Contact</span>
              <span className="text-white">{contactName}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-white/40 shrink-0">Email</span>
              <span className="text-white font-mono text-xs break-all">{contactEmail}</span>
            </div>
            {teamEmails.trim() && (
              <div>
                <span className="text-white/40">Team</span>
                <p className="text-white/70 font-mono text-xs mt-1 whitespace-pre-wrap">{teamEmails}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between mt-8">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))}
            className="inline-flex items-center gap-1 text-sm text-white/40 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          {step < 3 ? (
            <button
              type="button"
              disabled={!canNext}
              onClick={() => setStep((s) => (s < 3 ? ((s + 1) as Step) : s))}
              className="inline-flex items-center gap-1 px-5 py-2.5 rounded-xl bg-[#06B6D4] text-black text-sm font-semibold disabled:opacity-40"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={() => void submit()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white text-sm font-semibold disabled:opacity-50"
            >
              {loading ? "Creating…" : "Complete onboarding"}
            </button>
          )}
        </div>

        <p className="mt-8 text-sm text-white/40">
          <Link href="/" className="text-[#06B6D4] hover:underline">
            ← Back to OrchestrateOS
          </Link>
        </p>
      </main>
    </div>
  );
}
