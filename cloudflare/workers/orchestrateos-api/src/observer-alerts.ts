/** Observer alerts when runs are gate-blocked (Phase D). */

export type ObserverEnv = {
  OBSERVER_WEBHOOK_URL?: string;
  NOTIFY_EMAIL?: string;
  RESEND_API_KEY?: string;
};

export async function notifyRunBlocked(
  env: ObserverEnv,
  payload: {
    run_id: string;
    tenant_id: string;
    workflow_name: string;
    blocker_count: number;
    blockers: { required_action: string; step_name: string }[];
  },
): Promise<{ sent: boolean; channel?: string }> {
  const webhook = env.OBSERVER_WEBHOOK_URL?.trim();
  if (webhook) {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `OrchestrateOS: run ${payload.run_id} blocked (${payload.blocker_count} gate(s))`,
        run_id: payload.run_id,
        tenant_id: payload.tenant_id,
        workflow_name: payload.workflow_name,
        blockers: payload.blockers,
      }),
    });
    if (res.ok) return { sent: true, channel: "webhook" };
  }

  if (env.RESEND_API_KEY && env.NOTIFY_EMAIL) {
    const { sendEmail } = await import("./platform/email");
    const html = `<p>Run <code>${payload.run_id}</code> (${payload.workflow_name}) is blocked for tenant <strong>${payload.tenant_id}</strong>.</p>
      <ul>${payload.blockers.map((b) => `<li>${b.step_name}: ${b.required_action}</li>`).join("")}</ul>`;
    await sendEmail(env, env.NOTIFY_EMAIL, `[OrchestrateOS] Run blocked — ${payload.workflow_name}`, html);
    return { sent: true, channel: "email" };
  }

  return { sent: false };
}
