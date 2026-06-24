/** Outbound email via Resend API. */

export type EmailEnv = {
  RESEND_API_KEY?: string;
  NOTIFY_EMAIL?: string;
  SITE_URL?: string;
};

export async function sendEmail(
  env: EmailEnv,
  to: string,
  subject: string,
  html: string,
): Promise<boolean> {
  if (!env.RESEND_API_KEY) {
    console.log(`[email stub] to=${to} subject=${subject}`);
    return false;
  }
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "OrchestrateOS <onboarding@aitechpros.ai>",
      to: [to],
      subject,
      html,
    }),
  });
  if (!resp.ok) {
    console.error("Resend error", await resp.text());
    return false;
  }
  return true;
}

export function magicLinkEmail(siteUrl: string, token: string): { subject: string; html: string } {
  const link = `${siteUrl.replace(/\/$/, "")}/auth/verify?token=${encodeURIComponent(token)}`;
  return {
    subject: "Sign in to OrchestrateOS",
    html: `
      <p>Click to sign in to your OrchestrateOS partner portal. This link expires in 15 minutes.</p>
      <p><a href="${link}">Sign in</a></p>
      <p style="color:#666;font-size:12px">If you did not request this, ignore this email.</p>
    `,
  };
}

export function leadNotifyEmail(
  lead: { name: string; email: string; company?: string; use_case?: string },
): { subject: string; html: string } {
  return {
    subject: `New OrchestrateOS lead: ${lead.name}`,
    html: `
      <h2>New lead</h2>
      <ul>
        <li><strong>Name:</strong> ${escapeHtml(lead.name)}</li>
        <li><strong>Email:</strong> ${escapeHtml(lead.email)}</li>
        <li><strong>Company:</strong> ${escapeHtml(lead.company ?? "—")}</li>
        <li><strong>Use case:</strong> ${escapeHtml(lead.use_case ?? "—")}</li>
      </ul>
    `,
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
