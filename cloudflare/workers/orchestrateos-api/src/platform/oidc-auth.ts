/** OIDC token exchange helpers (Phase C) — uses issuer discovery for Google, Entra, Auth0, etc. */

export type OidcEnv = {
  OIDC_ISSUER?: string;
  OIDC_CLIENT_ID?: string;
  OIDC_CLIENT_SECRET?: string;
  SITE_URL?: string;
};

type OidcDiscovery = {
  authorization_endpoint: string;
  token_endpoint: string;
};

const discoveryCache = new Map<string, OidcDiscovery>();

function oidcConfigured(env: OidcEnv): boolean {
  return Boolean(env.OIDC_ISSUER?.trim() && env.OIDC_CLIENT_ID?.trim());
}

function siteBase(env: OidcEnv): string {
  return (env.SITE_URL ?? "https://orchestrateos.pages.dev").replace(/\/$/, "");
}

export function oidcEnabled(env: OidcEnv): boolean {
  return oidcConfigured(env);
}

async function getOidcDiscovery(issuer: string): Promise<OidcDiscovery> {
  const base = issuer.replace(/\/$/, "");
  const cached = discoveryCache.get(base);
  if (cached) return cached;

  const res = await fetch(`${base}/.well-known/openid-configuration`);
  if (!res.ok) throw new Error(`OIDC discovery failed for ${base}`);
  const doc = (await res.json()) as OidcDiscovery;
  if (!doc.authorization_endpoint || !doc.token_endpoint) {
    throw new Error("OIDC discovery missing endpoints");
  }
  discoveryCache.set(base, doc);
  return doc;
}

export async function buildOidcAuthorizeUrl(
  env: OidcEnv,
): Promise<{ authorize_url: string; state: string } | null> {
  if (!oidcConfigured(env)) return null;
  const discovery = await getOidcDiscovery(env.OIDC_ISSUER!);
  const redirectUri = `${siteBase(env)}/auth/oidc/callback`;
  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: env.OIDC_CLIENT_ID!,
    response_type: "code",
    scope: "openid email profile",
    redirect_uri: redirectUri,
    state,
  });
  return { authorize_url: `${discovery.authorization_endpoint}?${params.toString()}`, state };
}

type IdTokenClaims = { email?: string; name?: string };

function parseJwtPayload(token: string): IdTokenClaims {
  const parts = token.split(".");
  if (parts.length < 2) return {};
  const json = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(json) as IdTokenClaims;
}

export async function exchangeOidcCode(
  env: OidcEnv,
  code: string,
): Promise<{ email: string; name: string }> {
  if (!oidcConfigured(env)) throw new Error("OIDC not configured");
  const discovery = await getOidcDiscovery(env.OIDC_ISSUER!);
  const redirectUri = `${siteBase(env)}/auth/oidc/callback`;
  const tokenBody = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: env.OIDC_CLIENT_ID!,
  });
  if (env.OIDC_CLIENT_SECRET?.trim()) {
    tokenBody.set("client_secret", env.OIDC_CLIENT_SECRET);
  }

  const tokenRes = await fetch(discovery.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenBody.toString(),
  });
  if (!tokenRes.ok) throw new Error("OIDC token exchange failed");

  const tokens = (await tokenRes.json()) as { id_token?: string };
  if (!tokens.id_token) throw new Error("Missing id_token");

  const claims = parseJwtPayload(tokens.id_token);
  const email = claims.email?.trim().toLowerCase();
  if (!email) throw new Error("Email claim missing from IdP");

  return { email, name: claims.name?.trim() || email };
}
