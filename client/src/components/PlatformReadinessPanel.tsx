import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import {
  fetchAdminPlatformReadiness,
  type PlatformReadiness,
} from "@/lib/platform-api";

const CRITICAL: { key: keyof PlatformReadiness; label: string }[] = [
  { key: "session_secret", label: "SESSION_SECRET" },
  { key: "resend_api_key", label: "RESEND_API_KEY" },
  { key: "demo_operator_key", label: "DEMO_OPERATOR_KEY" },
];

const ONBOARDING: { key: keyof PlatformReadiness; label: string }[] = [
  { key: "session_secret", label: "SESSION_SECRET" },
  { key: "resend_api_key", label: "RESEND_API_KEY" },
  { key: "site_url", label: "SITE_URL" },
  { key: "admin_emails", label: "ADMIN_EMAILS" },
];

const OPTIONAL: { key: keyof PlatformReadiness; label: string }[] = [
  { key: "notify_email", label: "NOTIFY_EMAIL" },
  { key: "cron_secret", label: "CRON_SECRET" },
  { key: "api_keys_json", label: "API_KEYS_JSON" },
];

function Flag({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono ${
        ok
          ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
          : "bg-amber-500/10 text-amber-200 border border-amber-500/20"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-emerald-400" : "bg-amber-400"}`} />
      {label}
    </span>
  );
}

export default function PlatformReadinessPanel() {
  const [readiness, setReadiness] = useState<PlatformReadiness | null>(null);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      setReadiness(await fetchAdminPlatformReadiness());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load platform readiness");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
        Platform readiness: {error}
      </div>
    );
  }

  if (!readiness) {
    return (
      <div className="mb-6 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-white/40">
        Checking platform secrets…
      </div>
    );
  }

  const criticalOk = CRITICAL.every(({ key }) => readiness[key]);
  const optionalOk = OPTIONAL.every(({ key }) => readiness[key]);

  return (
    <section className="mb-6 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white/80">Platform readiness</p>
          <p className="text-xs text-white/40 mt-0.5">
            {criticalOk
              ? "Critical secrets configured — login, email, and demo flows ready."
              : "Missing critical secrets — configure before inviting partners."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="text-xs text-white/40 hover:text-white"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-[#06B6D4] hover:text-[#22D3EE]"
          >
            {expanded ? "Hide details" : "Show all flags"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {CRITICAL.map(({ key, label }) => (
          <Flag key={key} ok={Boolean(readiness[key])} label={label} />
        ))}
      </div>

      <div className="rounded-lg border border-white/[0.06] bg-black/20 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-white/75">Partner onboarding</p>
            <p className="text-xs text-white/40 mt-0.5">
              {readiness.ready_for_onboarding
                ? "Self-service /onboarding can issue tenants, runner keys, and magic links."
                : "Fix onboarding flags below before sharing the onboarding URL."}
            </p>
          </div>
          <span
            className={`text-xs font-semibold px-2 py-1 rounded ${
              readiness.ready_for_onboarding
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-amber-500/15 text-amber-200"
            }`}
          >
            {readiness.ready_for_onboarding ? "Ready" : "Not ready"}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {ONBOARDING.map(({ key, label }) => (
            <Flag key={key} ok={Boolean(readiness[key])} label={label} />
          ))}
        </div>

        <dl className="grid grid-cols-3 gap-3 mt-4 text-center text-xs">
          <div className="rounded-lg bg-white/[0.03] px-2 py-2">
            <dt className="text-white/35">Partners</dt>
            <dd className="text-white font-semibold text-lg">{readiness.partners.total}</dd>
          </div>
          <div className="rounded-lg bg-white/[0.03] px-2 py-2">
            <dt className="text-white/35">Active</dt>
            <dd className="text-white font-semibold text-lg">{readiness.partners.active}</dd>
          </div>
          <div className="rounded-lg bg-white/[0.03] px-2 py-2">
            <dt className="text-white/35">With runner key</dt>
            <dd className="text-white font-semibold text-lg">{readiness.partners.with_runner_key}</dd>
          </div>
        </dl>

        {readiness.ready_for_onboarding && (
          <div className="flex flex-wrap gap-2 mt-4">
            <a
              href={readiness.onboarding_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-[#06B6D4]/15 text-[#06B6D4] text-xs font-medium border border-[#06B6D4]/25 hover:bg-[#06B6D4]/25"
            >
              Open onboarding (smoke test)
            </a>
            <Link
              href="/admin/partners"
              className="px-3 py-1.5 rounded-lg border border-white/10 text-white/60 text-xs hover:text-white hover:border-white/20"
            >
              Manage partners
            </Link>
          </div>
        )}
      </div>

      {expanded && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-white/[0.06]">
          {OPTIONAL.map(({ key, label }) => (
            <Flag key={key} ok={Boolean(readiness[key])} label={label} />
          ))}
          {!optionalOk && (
            <p className="w-full text-xs text-white/35 mt-1">
              Optional flags may be unset in dev; set in production via wrangler secrets or CI sync.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
