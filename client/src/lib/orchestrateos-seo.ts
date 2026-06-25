/** OrchestrateOS product site meta — shared by Vite index.html transform and runtime updates. */

export const ORCHESTRATEOS_TAGLINE = "Agent workflows that resume, not restart";

export const ORCHESTRATEOS_SITE_TITLE = `OrchestrateOS — ${ORCHESTRATEOS_TAGLINE}`;

export const ORCHESTRATEOS_SITE_DESCRIPTION =
  "Governance-first agent orchestration: approval gates, audit trails, and deterministic resume for LangGraph, CrewAI, and Python — without Azure or LangSmith lock-in.";

export const ORCHESTRATEOS_SITE_KEYWORDS =
  "OrchestrateOS, agent orchestration, workflow resume, governance, audit trails, LangGraph, CrewAI, resume_engine";

function setMeta(nameOrProperty: string, content: string, isProperty = false) {
  const attr = isProperty ? "property" : "name";
  const selector = `meta[${attr}="${nameOrProperty}"]`;
  let el = document.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, nameOrProperty);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/** Runtime meta for OrchestrateOS Pages (and dev:orchestrateos). */
export function applyOrchestrateOSSiteMeta(options?: {
  title?: string;
  description?: string;
  url?: string;
}) {
  const title = options?.title ?? ORCHESTRATEOS_SITE_TITLE;
  const description = options?.description ?? ORCHESTRATEOS_SITE_DESCRIPTION;
  const url = options?.url ?? window.location.href;

  document.title = title;
  setMeta("description", description);
  setMeta("keywords", ORCHESTRATEOS_SITE_KEYWORDS);
  setMeta("og:type", "website", true);
  setMeta("og:site_name", "OrchestrateOS", true);
  setMeta("og:url", url, true);
  setMeta("og:title", title, true);
  setMeta("og:description", description, true);
  setMeta("twitter:card", "summary");
  setMeta("twitter:title", title);
  setMeta("twitter:description", description);
}

/** Static head tags injected at build/dev time for orchestrateos mode (crawler-friendly). */
export function orchestrateOSSiteMetaHtml(
  siteUrl = "https://orchestrateos.pages.dev",
): string {
  return `<title>${ORCHESTRATEOS_SITE_TITLE}</title>
    <meta name="description" content="${ORCHESTRATEOS_SITE_DESCRIPTION}" />
    <meta name="keywords" content="${ORCHESTRATEOS_SITE_KEYWORDS}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="OrchestrateOS" />
    <meta property="og:url" content="${siteUrl}" />
    <meta property="og:title" content="${ORCHESTRATEOS_SITE_TITLE}" />
    <meta property="og:description" content="${ORCHESTRATEOS_SITE_DESCRIPTION}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${ORCHESTRATEOS_SITE_TITLE}" />
    <meta name="twitter:description" content="${ORCHESTRATEOS_SITE_DESCRIPTION}" />`;
}
