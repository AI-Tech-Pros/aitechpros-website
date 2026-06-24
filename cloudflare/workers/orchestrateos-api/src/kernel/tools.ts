import type { KernelEnv } from "./execute";

export type ToolResult = {
  ok: boolean;
  output: Record<string, unknown>;
  error?: string;
  classification?: "transient" | "partial" | "permanent";
};

export const KERNEL_TOOLS = [
  "echo",
  "http_get",
  "health_probe",
  "json_validate",
  "hash_sha256",
  "fetch_run_status",
  "slack_notify",
  "delay_ms",
] as const;
export type KernelToolName = (typeof KERNEL_TOOLS)[number];

function isPublicHttps(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".local")) return false;
    if (/^127\.|^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return false;
    return true;
  } catch {
    return false;
  }
}

function isSlackWebhook(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === "hooks.slack.com";
  } catch {
    return false;
  }
}

async function hashSha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function invokeKernelTool(
  env: KernelEnv,
  runId: string,
  stepIndex: number,
  toolName: string,
  args: Record<string, unknown>,
): Promise<ToolResult> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const inputJson = JSON.stringify(args);

  let result: ToolResult;
  try {
    result = await executeTool(env, runId, toolName, args);
  } catch (err) {
    result = {
      ok: false,
      output: {},
      error: err instanceof Error ? err.message : "Tool execution failed",
      classification: "transient",
    };
  }

  await env.DB.prepare(
    `INSERT INTO kernel_tool_invocations (
      id, run_id, step_index, tool_name, input_json, output_json, status, error_message, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      runId,
      stepIndex,
      toolName,
      inputJson,
      JSON.stringify(result.output),
      result.ok ? "completed" : "failed",
      result.error ?? null,
      now,
    )
    .run();

  return result;
}

async function executeTool(
  env: KernelEnv,
  runId: string,
  toolName: string,
  args: Record<string, unknown>,
): Promise<ToolResult> {
  switch (toolName) {
    case "echo":
      return { ok: true, output: { echoed: args.message ?? args.text ?? "" } };

    case "json_validate": {
      const raw = String(args.text ?? args.json ?? "");
      if (!raw.trim()) {
        return { ok: false, output: {}, error: "text or json arg required", classification: "permanent" };
      }
      try {
        const parsed = JSON.parse(raw) as unknown;
        const kind = Array.isArray(parsed) ? "array" : parsed === null ? "null" : typeof parsed;
        return { ok: true, output: { valid: true, kind, preview: raw.slice(0, 256) } };
      } catch (err) {
        return {
          ok: false,
          output: {},
          error: err instanceof Error ? err.message : "Invalid JSON",
          classification: "permanent",
        };
      }
    }

    case "hash_sha256": {
      const text = String(args.text ?? args.message ?? "");
      if (!text) {
        return { ok: false, output: {}, error: "text arg required", classification: "permanent" };
      }
      const digest = await hashSha256(text);
      return { ok: true, output: { algorithm: "sha256", digest, length: text.length } };
    }

    case "fetch_run_status": {
      const targetRunId = String(args.run_id ?? runId);
      const run = await env.DB.prepare("SELECT * FROM runs WHERE run_id = ?")
        .bind(targetRunId)
        .first<{
          run_id: string;
          workflow_name: string;
          status: string;
          environment: string;
          metadata_json: string;
        }>();
      if (!run) {
        return {
          ok: false,
          output: {},
          error: `Run not found: ${targetRunId}`,
          classification: "permanent",
        };
      }
      const { results: steps } = await env.DB.prepare(
        `SELECT step_name, status, failure_classification FROM step_records
         WHERE run_id = ? ORDER BY sequence ASC`,
      )
        .bind(targetRunId)
        .all<{ step_name: string; status: string; failure_classification: string | null }>();
      return {
        ok: true,
        output: {
          run_id: run.run_id,
          workflow_name: run.workflow_name,
          status: run.status,
          environment: run.environment,
          steps: steps ?? [],
        },
      };
    }

    case "delay_ms": {
      const ms = Math.min(2000, Math.max(0, Number(args.ms ?? 0)));
      if (!Number.isFinite(ms)) {
        return { ok: false, output: {}, error: "ms must be a number", classification: "permanent" };
      }
      await new Promise((resolve) => setTimeout(resolve, ms));
      return { ok: true, output: { delayed_ms: ms } };
    }

    case "slack_notify": {
      const url = String(args.webhook_url ?? "");
      const text = String(args.text ?? args.message ?? "").slice(0, 3000);
      if (!isSlackWebhook(url)) {
        return {
          ok: false,
          output: {},
          error: "webhook_url must be https://hooks.slack.com/...",
          classification: "permanent",
        };
      }
      if (!text.trim()) {
        return { ok: false, output: {}, error: "text or message required", classification: "permanent" };
      }
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const body = (await response.text()).slice(0, 512);
      if (!response.ok) {
        return {
          ok: false,
          output: { status: response.status, body_preview: body },
          error: `Slack notify failed: HTTP ${response.status}`,
          classification: response.status >= 500 ? "transient" : "partial",
        };
      }
      return { ok: true, output: { status: response.status, body_preview: body } };
    }

    case "health_probe": {
      const base = (env.SITE_URL ?? "https://orchestrateos.pages.dev").replace(/\/$/, "");
      const response = await fetch(`${base}/`, { method: "GET" });
      const text = (await response.text()).slice(0, 512);
      if (!response.ok) {
        return {
          ok: false,
          output: { status: response.status, body_preview: text },
          error: `Health probe failed: HTTP ${response.status}`,
          classification: response.status >= 500 ? "transient" : "partial",
        };
      }
      return { ok: true, output: { status: response.status, body_preview: text } };
    }

    case "http_get": {
      const url = String(args.url ?? "");
      if (!isPublicHttps(url)) {
        return {
          ok: false,
          output: {},
          error: "Only public HTTPS URLs are allowed",
          classification: "permanent",
        };
      }
      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json, text/plain, */*" },
      });
      const text = (await response.text()).slice(0, 8192);
      if (!response.ok) {
        return {
          ok: false,
          output: { status: response.status, body_preview: text },
          error: `HTTP GET failed: ${response.status}`,
          classification: response.status >= 500 ? "transient" : "partial",
        };
      }
      return { ok: true, output: { status: response.status, body_preview: text } };
    }

    default:
      return {
        ok: false,
        output: {},
        error: `Unknown tool: ${toolName}. Available: ${KERNEL_TOOLS.join(", ")}`,
        classification: "permanent",
      };
  }
}
