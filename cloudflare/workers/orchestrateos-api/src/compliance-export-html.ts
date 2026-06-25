/** Printable HTML compliance bundle (save as PDF from browser). */

import type { ComplianceExport } from "./compliance-export";

export function complianceExportHtml(bundle: ComplianceExport): string {
  const blockers = bundle.resume_blockers
    .map(
      (b) =>
        `<tr><td>${escapeHtml(b.step_name)}</td><td>${escapeHtml(b.required_action)}</td><td>${escapeHtml(b.message)}</td></tr>`,
    )
    .join("");

  const auditRows = bundle.audit_events
    .slice(0, 50)
    .map(
      (e) =>
        `<tr><td>${escapeHtml(e.created_at)}</td><td>${escapeHtml(e.event_type)}</td><td>${escapeHtml(e.actor ?? "—")}</td></tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>OrchestrateOS Compliance — ${escapeHtml(bundle.run.run_id)}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; color: #111; font-size: 12px; }
    h1 { font-size: 18px; } h2 { font-size: 14px; margin-top: 1.5rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
    th { background: #f4f4f4; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; max-width: 640px; }
    .meta dt { font-weight: 600; } .meta dd { margin: 0 0 8px 0; }
    @media print { body { margin: 1cm; } }
  </style>
</head>
<body>
  <h1>OrchestrateOS Compliance Export</h1>
  <p>Exported ${escapeHtml(bundle.exported_at)} · ${escapeHtml(bundle.product)} v${escapeHtml(bundle.export_version)}</p>
  <dl class="meta">
    <dt>Run ID</dt><dd>${escapeHtml(bundle.run.run_id)}</dd>
    <dt>Workflow</dt><dd>${escapeHtml(bundle.run.workflow_name)}</dd>
    <dt>Status</dt><dd>${escapeHtml(bundle.run.status)}</dd>
    <dt>Environment</dt><dd>${escapeHtml(bundle.run.environment)}</dd>
    <dt>Tenant</dt><dd>${escapeHtml(bundle.run.tenant_id)}</dd>
    <dt>Steps</dt><dd>${bundle.integrity.step_count}</dd>
    <dt>Idempotency</dt><dd>${bundle.idempotency_analysis.side_effect_safe ? "Clear" : "Review required"}</dd>
  </dl>
  <h2>Active gate blockers</h2>
  <table><thead><tr><th>Step</th><th>Action</th><th>Message</th></tr></thead>
  <tbody>${blockers || "<tr><td colspan=3>None</td></tr>"}</tbody></table>
  <h2>Audit trail (recent)</h2>
  <table><thead><tr><th>Time</th><th>Event</th><th>Actor</th></tr></thead>
  <tbody>${auditRows || "<tr><td colspan=3>None</td></tr>"}</tbody></table>
  <p style="margin-top:2rem;color:#666">Use browser Print → Save as PDF for auditor handoff.</p>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
