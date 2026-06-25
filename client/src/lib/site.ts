/** Hostname and routing — main site + OrchestrateOS product on separate Pages projects. */

export const MAIN_SITE_URL = "https://aitechpros-website.pages.dev";
export const ORCHESTRATEOS_SITE_URL = "https://orchestrateos.pages.dev";
const DEFAULT_API_URL = "https://orchestrateos-api.nevaquit.workers.dev";

const ORCHESTRATEOS_HOST = "orchestrateos.pages.dev";

/** Build-time flag: dedicated OrchestrateOS Pages bundle (root at `/`). */
export function isOrchestrateOSApp(): boolean {
  return import.meta.env.VITE_APP === "orchestrateos";
}

/** Runtime: dedicated OrchestrateOS Pages host or orchestrateos build. */
export function isOrchestrateOSProductSite(): boolean {
  if (isOrchestrateOSApp()) return true;
  if (typeof window === "undefined") return false;
  return window.location.hostname.toLowerCase() === ORCHESTRATEOS_HOST;
}

/** @deprecated Use isOrchestrateOSProductSite — legacy path check for redirects only. */
export function isOrchestrateOSHost(): boolean {
  return isOrchestrateOSProductSite();
}

/** Origin for the current app context. */
export function siteOrigin(): string {
  const env = import.meta.env.VITE_SITE_URL as string | undefined;
  if (env) return env.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return isOrchestrateOSApp() ? ORCHESTRATEOS_SITE_URL : MAIN_SITE_URL;
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

/** Canonical OrchestrateOS product URL (always orchestrateos.pages.dev). */
export function orchestrateOSUrl(path = ""): string {
  const suffix = path.startsWith("/") ? path : path ? `/${path}` : "";
  const base = ORCHESTRATEOS_SITE_URL;
  return suffix ? `${base}${suffix}` : base;
}

/** Main marketing site URL (always aitechpros-website.pages.dev). */
export function mainSiteUrl(path = "/"): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${MAIN_SITE_URL}${suffix}`;
}

/** Optional demo operator API key for gate explorer write actions (Bearer). */
export function orchestrateOSApiKey(): string | undefined {
  const key = import.meta.env.VITE_ORCHESTRATEOS_DEMO_KEY as string | undefined;
  return key?.trim() || undefined;
}

/** OpenAPI docs URL for the control plane API. */
export function orchestrateOSApiDocsUrl(): string {
  return `${orchestrateOSApiBaseUrl()}/docs`;
}

/** Platform API base (auth, partner portal). Local dev uses Vite `/api` proxy. */
export function platformApiBase(): string {
  if (typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1") return "";
  }
  return orchestrateOSApiBaseUrl();
}
