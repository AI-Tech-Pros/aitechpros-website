import { useCallback, useEffect, useState } from "react";
import {
  fetchAdminPlatformReadiness,
  type PlatformReadiness,
} from "@/lib/platform-api";

const CRITICAL: { key: keyof PlatformReadiness; label: string }[] = [
  { key: "session_secret", label: "SESSION_SECRET" },
  { key: "resend_api_key", label: "RESEND_API_KEY" },
  { key: "demo_operator_key", label: "DEMO_OPERATOR_KEY" },
];

const OPTIONAL: { key: keyof PlatformReadiness; label: string }[] = [
  { key: "admin_emails", label: "ADMIN_EMAILS" },
  { key: "notify_email", label: "NOTIFY_EMAIL" },
  { key: "cron_secret", label: "CRON_SECRET" },
  { key: "api_keys_json", label: "API_KEYS_JSON" },
  { key: "site_url", label: "SITE_URL" },
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
    <section className="mb-6 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white/80">Platform readiness</p>
          <p className="text-xs text-white/40 mt-0.5">
            {criticalOk
              ? "Critical secrets configured — login, email, and demo flows ready."
              : "Missing critical secrets — fix before partner onboarding."}
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

      <div className="flex flex-wrap gap-2 mt-3">
        {CRITICAL.map(({ key, label }) => (
          <Flag key={key} ok={readiness[key]} label={label} />
        ))}
      </div>

      {expanded && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/[0.06]">
          {OPTIONAL.map(({ key, label }) => (
            <Flag key={key} ok={readiness[key]} label={label} />
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
