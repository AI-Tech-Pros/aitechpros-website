import type { KernelEnv } from "./execute";

export type ToolResult = {
  ok: boolean;
  output: Record<string, unknown>;
  error?: string;
  classification?: "transient" | "partial" | "permanent";
};

export const KERNEL_TOOLS = ["echo", "http_get", "health_probe"] as const;
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
    result = await executeTool(env, toolName as KernelToolName, args);
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
  toolName: KernelToolName,
  args: Record<string, unknown>,
): Promise<ToolResult> {
  switch (toolName) {
    case "echo":
      return { ok: true, output: { echoed: args.message ?? args.text ?? "" } };

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
        error: `Unknown tool: ${toolName}`,
        classification: "permanent",
      };
  }
}
