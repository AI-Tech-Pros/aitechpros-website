#!/usr/bin/env node
/**
 * Merge GitHub CI secrets into API_KEYS_JSON for wrangler secret put.
 * - API_KEYS_JSON (optional): full key map — preserved when set in GitHub
 * - ORCHESTRATEOS_API_KEY: ensured as runner with tenant default if missing
 */

const runnerKey = process.env.ORCHESTRATEOS_API_KEY?.replace(/^\uFEFF/, "").trim();
const baseJson = process.env.API_KEYS_JSON?.trim();

let keys = {};
if (baseJson) {
  try {
    keys = JSON.parse(baseJson);
    if (typeof keys !== "object" || keys === null || Array.isArray(keys)) {
      console.error("API_KEYS_JSON must be a JSON object");
      process.exit(1);
    }
  } catch {
    console.error("API_KEYS_JSON is not valid JSON");
    process.exit(1);
  }
}

if (runnerKey && keys[runnerKey] === undefined) {
  keys[runnerKey] = { role: "runner", tenant: "default" };
}

if (!runnerKey && Object.keys(keys).length === 0) {
  console.error("Set ORCHESTRATEOS_API_KEY or API_KEYS_JSON for Worker key sync");
  process.exit(1);
}

if (process.argv.includes("--print-runner")) {
  if (runnerKey && keys[runnerKey] !== undefined) {
    console.log(runnerKey);
    process.exit(0);
  }
  for (const [key, value] of Object.entries(keys)) {
    const role = typeof value === "string" ? value : value?.role;
    if (role === "runner") {
      console.log(key);
      process.exit(0);
    }
  }
  if (runnerKey) {
    console.log(runnerKey);
    process.exit(0);
  }
  process.exit(1);
}

process.stdout.write(JSON.stringify(keys));
