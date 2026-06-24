import { Check, Circle } from "lucide-react";
import type { PartnerJourney } from "@/lib/platform-api";

const STEP_LABELS: { key: keyof PartnerJourney["steps"]; label: string }[] = [
  { key: "onboarded", label: "Partner workspace created" },
  { key: "runner_key", label: "Runner API key active" },
  { key: "signed_in", label: "Signed in to partner portal" },
  { key: "first_workflow", label: "Sample workflow completed" },
  { key: "sdk_connected", label: "SDK pipeline synced" },
];

type Props = {
  journey: PartnerJourney;
};

export default function PartnerJourneyPanel({ journey }: Props) {
  return (
    <section className="rounded-2xl border border-[#8B5CF6]/25 bg-[#8B5CF6]/5 p-6 mb-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white font-[Montserrat]">Getting started</h2>
          <p className="text-white/45 text-sm mt-1">
            {journey.progress_percent}% complete · tenant{" "}
            <code className="text-[#06B6D4]">{journey.tenant_id}</code>
            {journey.runner_api_key_hint ? (
              <>
                {" "}
                · key hint <code className="text-white/50">{journey.runner_api_key_hint}</code>
              </>
            ) : null}
          </p>
        </div>
        <div className="h-2 w-32 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] transition-all"
            style={{ width: `${journey.progress_percent}%` }}
          />
        </div>
      </div>
      <ul className="space-y-2">
        {STEP_LABELS.map(({ key, label }) => {
          const done = journey.steps[key];
          return (
            <li key={key} className="flex items-center gap-3 text-sm">
              {done ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-white/25 shrink-0" />
              )}
              <span className={done ? "text-white/70" : "text-white/45"}>{label}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
