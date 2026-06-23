/** Hostname and routing helpers for multi-product site layout. */

export const ORCHESTRATEOS_PRODUCTION_HOST = "orchestrateos.aitechpros.ai";
export const ORCHESTRATEOS_API_PRODUCTION_HOST = "api.orchestrateos.aitechpros.ai";
export const MAIN_SITE_HOST = "aitechpros.ai";

/** True when the app is served on the OrchestrateOS product subdomain. */
export function isOrchestrateOSHost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname.toLowerCase();
  return (
    host === ORCHESTRATEOS_PRODUCTION_HOST ||
    host.startsWith("orchestrateos.")
  );
}

/** Product URL — subdomain in production, path fallback on main domain / localhost. */
export function orchestrateOSUrl(path = ""): string {
  const suffix = path.startsWith("/") ? path : path ? `/${path}` : "";
  if (typeof window !== "undefined" && isOrchestrateOSHost()) {
    return `${window.location.origin}${suffix || "/"}`;
  }
  return `https://${ORCHESTRATEOS_PRODUCTION_HOST}${suffix || "/"}`;
}

/** Main marketing site URL from the product subdomain. */
export function mainSiteUrl(path = "/"): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `https://${MAIN_SITE_HOST}${suffix}`;
}

/** Resume engine API base URL — env override, dev proxy, or production subdomain. */
export function orchestrateOSApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_ORCHESTRATEOS_API_URL as string | undefined;
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1") {
      return "/orchestrateos-api";
    }
    if (isOrchestrateOSHost() || host.endsWith(".aitechpros.ai")) {
      return `https://${ORCHESTRATEOS_API_PRODUCTION_HOST}`;
    }
  }

  return `https://${ORCHESTRATEOS_API_PRODUCTION_HOST}`;
}

/** OpenAPI docs URL for the control plane API. */
export function orchestrateOSApiDocsUrl(): string {
  return `${orchestrateOSApiBaseUrl()}/docs`;
}
