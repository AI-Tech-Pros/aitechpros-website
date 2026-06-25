import type { ComplianceExport } from "@/lib/orchestrateos-api";
import { orchestrateOSApiBaseUrl, platformApiBase } from "@/lib/site";
import { getStoredSessionToken } from "@/lib/platform-api";

/** Open printable HTML and trigger browser Print → Save as PDF. */
export function openCompliancePdfPrint(bundle: ComplianceExport): void {
  const blockers = bundle.resume_blockers
    .map(
      (b) =>
        `<tr><td>${esc(b.step_name)}</td><td>${esc(b.required_action)}</td><td>${esc(b.message)}</td></tr>`,
    )
    .join("");
  const auditRows = bundle.audit_events
    .slice(0, 50)
    .map(
      (e) =>
        `<tr><td>${esc(e.created_at)}</td><td>${esc(e.event_type)}</td><td>${esc(e.actor ?? "—")}</td></tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><title>Compliance ${esc(bundle.run.run_id)}</title>
<style>body{font-family:system-ui;margin:2rem;font-size:12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px}th{background:#f4f4f4}</style></head>
<body><h1>OrchestrateOS Compliance Export</h1>
<p>Run ${esc(bundle.run.run_id)} · ${esc(bundle.run.workflow_name)} · ${esc(bundle.run.status)}</p>
<h2>Gate blockers</h2><table><tr><th>Step</th><th>Action</th><th>Message</th></tr>${blockers || "<tr><td colspan=3>None</td></tr>"}</table>
<h2>Audit trail</h2><table><tr><th>Time</th><th>Event</th><th>Actor</th></tr>${auditRows}</table>
<script>window.onload=()=>window.print()</script></body></html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

export async function downloadComplianceHtml(runId: string, partnerSession: boolean): Promise<void> {
  const url = partnerSession
    ? `${platformApiBase()}/partners/me/runs/${encodeURIComponent(runId)}/compliance_export?download=pdf`
    : `${orchestrateOSApiBaseUrl()}/runs/${encodeURIComponent(runId)}/compliance_export?download=pdf`;

  const headers: Record<string, string> = {};
  const token = getStoredSessionToken();
  if (partnerSession && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = `orchestrateos-compliance-${runId}.html`;
  anchor.click();
  URL.revokeObjectURL(blobUrl);
}

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
