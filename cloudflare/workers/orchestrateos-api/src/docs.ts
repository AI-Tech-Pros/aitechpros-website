export const OPENAPI_SPEC = {
  openapi: "3.0.3",
  info: {
    title: "OrchestrateOS Control Plane API",
    version: "0.1.0",
    description:
      "Cloudflare Worker + D1 API for run lifecycle, resume gates, compensation, and audit logs.",
  },
  servers: [{ url: "https://orchestrateos-api.nevaquit.workers.dev" }],
  paths: {
    "/health": {
      get: { summary: "Health check", responses: { "200": { description: "OK" } } },
    },
    "/start_run": {
      post: {
        summary: "Create a new workflow run",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  workflow_name: { type: "string" },
                  run_id: { type: "string", format: "uuid" },
                  metadata: { type: "object" },
                },
                required: ["workflow_name"],
              },
            },
          },
        },
      },
    },
    "/runs/{run_id}": {
      get: { summary: "Full run with step audit trail (Python SDK shape)" },
      patch: { summary: "Update run status and metadata" },
    },
    "/idempotency/{key}": {
      get: { summary: "Lookup completed step by idempotency key" },
    },
    "/runs/{run_id}/steps": {
      post: {
        summary: "Record a completed or failed step",
        parameters: [{ name: "run_id", in: "path", required: true, schema: { type: "string" } }],
      },
    },
    "/runs/{run_id}/status": {
      get: { summary: "Run status and gate summary" },
    },
    "/runs/{run_id}/resume_blockers": {
      get: { summary: "List compensation/approval gates" },
    },
    "/runs/{run_id}/compensate": {
      post: { summary: "Record partial-failure compensation" },
    },
    "/runs/{run_id}/approve": {
      post: { summary: "Grant human approval for permanent failure" },
    },
    "/resume": {
      post: { summary: "Validate resume readiness (409 if gated)" },
    },
    "/runs/{run_id}/audit_log": {
      get: { summary: "Deterministic audit trace" },
    },
    "/demo/runs": {
      get: { summary: "List seeded demo runs for the gate explorer" },
    },
    "/demo/reset": {
      post: { summary: "Reset demo runs to initial gate state" },
    },
  },
} as const;

export const DOCS_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>OrchestrateOS API</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 52rem; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; color: #0f172a; }
    h1 { font-size: 1.5rem; }
    table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; font-size: 0.9rem; }
    th, td { text-align: left; padding: 0.5rem 0.75rem; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
    th { background: #f8fafc; }
    code { background: #f1f5f9; padding: 0.1rem 0.35rem; border-radius: 0.25rem; font-size: 0.85em; }
    a { color: #2563eb; }
    .demo { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 0.5rem; padding: 1rem; margin: 1rem 0; }
  </style>
</head>
<body>
  <h1>OrchestrateOS Control Plane API</h1>
  <p>Worker + D1 · <a href="/health">/health</a> · <a href="/openapi.json">openapi.json</a></p>
  <div class="demo">
    <strong>Live demo runs</strong> (gate explorer on <a href="https://orchestrateos.pages.dev/#gates">orchestrateos.pages.dev</a>):
    <ul>
      <li><code>GET /demo/runs</code> — list run IDs</li>
      <li><code>POST /demo/reset</code> — reset gates after testing compensation/approval</li>
    </ul>
  </div>
  <table>
    <thead><tr><th>Method</th><th>Path</th><th>Description</th></tr></thead>
    <tbody>
      <tr><td>GET</td><td><code>/health</code></td><td>Load balancer health check</td></tr>
      <tr><td>POST</td><td><code>/start_run</code></td><td>Create a new workflow run (optional <code>run_id</code>)</td></tr>
      <tr><td>GET</td><td><code>/runs/{run_id}</code></td><td>Full run + steps (Python SDK)</td></tr>
      <tr><td>PATCH</td><td><code>/runs/{run_id}</code></td><td>Update status / metadata</td></tr>
      <tr><td>GET</td><td><code>/idempotency/{key}</code></td><td>Idempotent step lookup</td></tr>
      <tr><td>POST</td><td><code>/runs/{run_id}/steps</code></td><td>Record step completion or failure</td></tr>
      <tr><td>GET</td><td><code>/runs/{run_id}/status</code></td><td>Run status + gate summary</td></tr>
      <tr><td>GET</td><td><code>/runs/{run_id}/resume_blockers</code></td><td>List active gates</td></tr>
      <tr><td>POST</td><td><code>/runs/{run_id}/compensate</code></td><td>Record partial-failure compensation</td></tr>
      <tr><td>POST</td><td><code>/runs/{run_id}/approve</code></td><td>Grant human approval (permanent failures)</td></tr>
      <tr><td>POST</td><td><code>/resume</code></td><td>Validate resume (409 if gated)</td></tr>
      <tr><td>GET</td><td><code>/runs/{run_id}/audit_log</code></td><td>Deterministic audit trace</td></tr>
      <tr><td>GET</td><td><code>/demo/runs</code></td><td>Seeded demo run catalog</td></tr>
      <tr><td>POST</td><td><code>/demo/reset</code></td><td>Reset demo runs to initial state</td></tr>
    </tbody>
  </table>
</body>
</html>`;
