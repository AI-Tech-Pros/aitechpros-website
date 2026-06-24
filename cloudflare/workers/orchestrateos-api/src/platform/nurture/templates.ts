/** Nurture email templates — mirrors cloudflare/email-templates/*.md */

export type TemplateVars = {
  name: string;
  company: string | null;
};

type NurtureTemplate = {
  subject: string;
  html: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function companyClause(company: string | null): string {
  return company ? ` from ${escapeHtml(company)}` : "";
}

function render(template: string, vars: TemplateVars): string {
  return template
    .replace(/\{\{name\}\}/g, escapeHtml(vars.name))
    .replace(/\{\{company\}\}/g, companyClause(vars.company));
}

const WELCOME_0_BODY = `
<p>Hi {{name}},</p>
<p>Thanks for reaching out about governed resume for your agent workflows{{company}}.</p>
<p><strong>What happens next</strong></p>
<ul>
  <li>We review your use case within one business day</li>
  <li>Design partners get a tenant-scoped runner key and partner dashboard</li>
  <li>You wire <code>RemoteCheckpointStore</code> to your LangGraph, CrewAI, or plain Python pipeline</li>
</ul>
<p><a href="https://orchestrateos.pages.dev/#gates">Explore the live gate explorer</a></p>
<p>— AI Tech Pros</p>
`;

const WELCOME_1_BODY = `
<p>Hi {{name}},</p>
<p>Following up on your early-access request{{company}}.</p>
<p>If you are evaluating resume + governance for production agent pipelines:</p>
<ul>
  <li><a href="https://orchestrateos.pages.dev/install">Install guide</a></li>
  <li><a href="https://orchestrateos.pages.dev/onboarding">Partner onboarding</a></li>
  <li><a href="https://orchestrateos-api.nevaquit.workers.dev/docs">API docs</a></li>
</ul>
<p>Reply if you want a walkthrough of compensation, approval, and prod-resume gates.</p>
<p>— AI Tech Pros</p>
`;

const POST_DEMO_0_BODY = `
<p>Hi {{name}},</p>
<p>Thanks for the conversation{{company}}.</p>
<p><strong>Suggested next steps</strong></p>
<ol>
  <li><a href="https://orchestrateos.pages.dev/onboarding">Complete partner onboarding</a></li>
  <li>Install the SDK: <code>pip install "resume_engine[remote]"</code></li>
  <li>Run your first workflow against staging with a tenant-scoped runner key</li>
</ol>
<p>We can help map your failure gates to transient, partial, and permanent classifications.</p>
<p>— AI Tech Pros</p>
`;

const TEMPLATES: Record<string, NurtureTemplate & { body: string }> = {
  "welcome-0": {
    subject: "Thanks for your interest in OrchestrateOS",
    body: WELCOME_0_BODY,
    html: "",
  },
  "welcome-1": {
    subject: "OrchestrateOS — quick follow-up",
    body: WELCOME_1_BODY,
    html: "",
  },
  "post-demo-0": {
    subject: "After your OrchestrateOS demo",
    body: POST_DEMO_0_BODY,
    html: "",
  },
};

export function renderNurtureEmail(
  templateId: string,
  vars: TemplateVars,
): { subject: string; html: string } | null {
  const tpl = TEMPLATES[templateId];
  if (!tpl) return null;
  return {
    subject: tpl.subject,
    html: render(tpl.body, vars),
  };
}
