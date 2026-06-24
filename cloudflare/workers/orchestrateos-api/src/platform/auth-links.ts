/** Magic link issuance (login + onboarding). */

import { magicLinkEmail, sendEmail, type EmailEnv } from "./email";
import { hashToken } from "./session";

const MAGIC_LINK_TTL_MS = 15 * 60 * 1000;

export async function storeAndSendMagicLink(
  env: EmailEnv & { SITE_URL?: string; DB: D1Database },
  email: string,
): Promise<boolean> {
  const token = crypto.randomUUID() + crypto.randomUUID();
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MS).toISOString();
  await env.DB.prepare(
    `INSERT INTO magic_link_tokens (token_hash, email, expires_at) VALUES (?, ?, ?)`,
  )
    .bind(tokenHash, email, expiresAt)
    .run();

  const siteUrl = env.SITE_URL ?? "https://orchestrateos.pages.dev";
  const { subject, html } = magicLinkEmail(siteUrl, token);
  return sendEmail(env, email, subject, html);
}
