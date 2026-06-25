/**
 * Create OrchestrateOS Google OAuth client (AI Tech Pros Inc project) and print credentials.
 * Run: node scripts/create-google-oauth.mjs
 */
import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const PROJECT = "healthy-matter-453416-t3";
const REDIRECT = "https://orchestrateos.pages.dev/auth/oidc/callback";
const ORIGIN = "https://orchestrateos.pages.dev";
const CLIENT_NAME = "OrchestrateOS Partner SSO";

async function main() {
  const browser = await chromium.launch({ headless: false, slowMo: 80 });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("Opening Google Auth Platform (sign in if prompted)...");
  await page.goto(
    `https://console.cloud.google.com/auth/clients/create?project=${PROJECT}`,
    { waitUntil: "domcontentloaded", timeout: 120_000 },
  );

  await page.waitForTimeout(5000);

  // Application type: Web application
  const webApp = page.getByText("Web application", { exact: true });
  if (await webApp.isVisible({ timeout: 15_000 }).catch(() => false)) {
    await webApp.click();
    await page.getByRole("button", { name: /next|continue|create/i }).first().click({ timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }

  // Name field
  const nameInput = page.locator('input[aria-label*="Name"], input[formcontrolname="displayName"]').first();
  if (await nameInput.isVisible({ timeout: 20_000 }).catch(() => false)) {
    await nameInput.fill(CLIENT_NAME);
  }

  // Redirect URIs
  const redirectInput = page.locator(
    'input[aria-label*="redirect" i], input[placeholder*="redirect" i], input[formcontrolname="redirectUris"]',
  ).first();
  if (await redirectInput.isVisible({ timeout: 10_000 }).catch(() => false)) {
    await redirectInput.fill(REDIRECT);
  } else {
    const addUri = page.getByRole("button", { name: /add uri/i }).first();
    if (await addUri.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addUri.click();
      await page.keyboard.type(REDIRECT);
    }
  }

  // JS origins
  const originInput = page.locator(
    'input[aria-label*="origin" i], input[placeholder*="origin" i], input[formcontrolname="javascriptOrigins"]',
  ).first();
  if (await originInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await originInput.fill(ORIGIN);
  }

  // Create / Save
  const createBtn = page.getByRole("button", { name: /create|save/i }).last();
  await createBtn.click({ timeout: 15_000 }).catch(async () => {
    console.log("Could not auto-click Create — complete the form in the browser window.");
    console.log(`Redirect URI: ${REDIRECT}`);
    console.log(`JS origin: ${ORIGIN}`);
    await page.waitForTimeout(180_000);
  });

  await page.waitForTimeout(4000);

  // Extract credentials from dialog or page text
  const body = await page.locator("body").innerText();
  const clientIdMatch = body.match(/[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com/i);
  const secretMatch = body.match(/GOCSPX-[A-Za-z0-9_-]+/);

  let clientId = clientIdMatch?.[0] ?? "";
  let clientSecret = secretMatch?.[0] ?? "";

  if (!clientId || !clientSecret) {
    console.log("\n=== MANUAL STEP ===");
    console.log("Copy Client ID and Client secret from the browser dialog.");
    console.log("Waiting 3 minutes for the create dialog to appear...");
    await page.waitForTimeout(180_000);
    const body2 = await page.locator("body").innerText();
    clientId = body2.match(/[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com/i)?.[0] ?? "";
    clientSecret = body2.match(/GOCSPX-[A-Za-z0-9_-]+/)?.[0] ?? "";
  }

  await browser.close();

  if (!clientId || !clientSecret) {
    console.error("Could not read OAuth credentials from the page. Create the client manually and run:");
    console.error("  .\\scripts\\setup-google-oidc-secrets.ps1");
    process.exit(1);
  }

  console.log("OAuth client created.");
  console.log("Client ID found:", clientId.slice(0, 20) + "...");

  execSync(`gh secret set OIDC_CLIENT_ID`, { input: clientId, stdio: ["pipe", "inherit", "inherit"] });
  execSync(`gh secret set OIDC_CLIENT_SECRET`, { input: clientSecret, stdio: ["pipe", "inherit", "inherit"] });
  console.log("GitHub secrets set.");

  execSync("gh workflow run Cloudflare Deploy", { stdio: "inherit", cwd: repoRoot });
  console.log("Cloudflare Deploy triggered.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
