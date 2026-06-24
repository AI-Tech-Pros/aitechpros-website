/** Hostname and routing helpers — Cloudflare Pages (*.pages.dev) + Workers (*.workers.dev). */

const DEFAULT_PAGES_URL = "https://aitechpros-website.pages.dev";
const DEFAULT_API_URL = "https://orchestrateos-api.nevaquit.workers.dev";

/** Public site origin (Pages). */
export function siteOrigin(): string {
  const env = import.meta.env.VITE_SITE_URL as string | undefined;
  if (env) return env.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return DEFAULT_PAGES_URL;
}

/** OrchestrateOS API base URL (Worker). */
export function orchestrateOSApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_ORCHESTRATEOS_API_URL as string | undefined;
  if (envUrl) return envUrl.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1") {
      return "/orchestrateos-api";
    }
  }

  return DEFAULT_API_URL;
}

/** True on OrchestrateOS product routes (/orchestrateos on Pages). */
export function isOrchestrateOSHost(): boolean {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname;
  return path === "/orchestrateos" || path.startsWith("/orchestrateos/");
}

/** Product URL — path on Pages in production. */
export function orchestrateOSUrl(path = ""): string {
  const suffix = path.startsWith("/") ? path : path ? `/${path}` : "";
  const base = `${siteOrigin()}/orchestrateos`;
  return suffix ? `${base}${suffix}` : base;
}

/** Main marketing site URL. */
export function mainSiteUrl(path = "/"): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${siteOrigin()}${suffix}`;
}

/** OpenAPI docs URL for the control plane API. */
export function orchestrateOSApiDocsUrl(): string {
  return `${orchestrateOSApiBaseUrl()}/docs`;
}
