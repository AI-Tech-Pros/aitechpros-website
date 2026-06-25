/** Daily auditor digest — blocked runs summary (Phase D). */

import { sendEmail, type EmailEnv } from "./platform/email";
import { buildOpsSummary } from "./governance-metrics";

export async function runAuditorDigest(env: EmailEnv & { DB: D1Database; NOTIFY_EMAIL?: string }): Promise<{
  sent: boolean;
  blocked_runs: number;
}> {
  const summary = await buildOpsSummary(env.DB);
  if (!env.NOTIFY_EMAIL || !env.RESEND_API_KEY || summary.runs_blocked_total === 0) {
    return { sent: false, blocked_runs: summary.runs_blocked_total };
  }

  const html = `<p>OrchestrateOS auditor digest</p>
<ul>
<li>Blocked runs: ${summary.runs_blocked_total}</li>
<li>Ingress pending: ${summary.ingress_pending}</li>
<li>Ingress failed: ${summary.ingress_failed}</li>
</ul>
<p>Export compliance bundles via <code>GET /runs/:id/compliance_export?download=pdf</code>.</p>`;

  await sendEmail(
    env,
    env.NOTIFY_EMAIL,
    `[OrchestrateOS] Auditor digest — ${summary.runs_blocked_total} blocked run(s)`,
    html,
  );
  return { sent: true, blocked_runs: summary.runs_blocked_total };
}
