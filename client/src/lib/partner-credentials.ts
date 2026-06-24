/** Session-scoped runner key from onboarding (same browser tab only). */

const RUNNER_KEY_STORAGE = "orchestrateos_runner_key_once";

export function stashRunnerKey(key: string): void {
  try {
    sessionStorage.setItem(RUNNER_KEY_STORAGE, key);
  } catch {
    /* ignore */
  }
}

export function readStashedRunnerKey(): string | null {
  try {
    return sessionStorage.getItem(RUNNER_KEY_STORAGE);
  } catch {
    return null;
  }
}

export function clearStashedRunnerKey(): void {
  try {
    sessionStorage.removeItem(RUNNER_KEY_STORAGE);
  } catch {
    /* ignore */
  }
}

export function buildRemoteQuickstart(apiUrl: string, apiKey: string, tenantId: string): string {
  return `pip install "resume_engine[remote]"

export ORCHESTRATEOS_API_KEY="${apiKey}"
export ORCHESTRATEOS_TENANT="${tenantId}"

from resume_engine.core.checkpoint_store import ResumeEngine
from resume_engine.storage.remote_backend import RemoteCheckpointStore

API = "${apiUrl}"

with RemoteCheckpointStore(API, api_key=ORCHESTRATEOS_API_KEY) as store:
    engine = ResumeEngine(store)
    run = engine.start_run("my_pipeline", metadata={"environment": "dev", "tenant": "${tenantId}"})
    print("Run started:", run.run_id)`;
}
