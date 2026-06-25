/** OIDC token exchange helpers (Phase C foundation). */

export type OidcEnv = {
  OIDC_ISSUER?: string;
  OIDC_CLIENT_ID?: string;
  OIDC_CLIENT_SECRET?: string;
  SITE_URL?: string;
};

function oidcConfigured(env: OidcEnv): boolean {
  return Boolean(env.OIDC_ISSUER?.trim() && env.OIDC_CLIENT_ID?.trim());
}

function siteBase(env: OidcEnv): string {
  return (env.SITE_URL ?? "https://orchestrateos.pages.dev").replace(/\/$/, "");
}

export function oidcEnabled(env: OidcEnv): boolean {
  return oidcConfigured(env);
}

export function buildOidcAuthorizeUrl(env: OidcEnv): { authorize_url: string; state: string } | null {
  if (!oidcConfigured(env)) return null;
  const issuer = env.OIDC_ISSUER!.replace(/\/$/, "");
  const redirectUri = `${siteBase(env)}/auth/oidc/callback`;
  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: env.OIDC_CLIENT_ID!,
    response_type: "code",
    scope: "openid email profile",
    redirect_uri: redirectUri,
    state,
  });
  return { authorize_url: `${issuer}/authorize?${params.toString()}`, state };
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
  const issuer = env.OIDC_ISSUER!.replace(/\/$/, "");
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

  const tokenRes = await fetch(`${issuer}/token`, {
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
