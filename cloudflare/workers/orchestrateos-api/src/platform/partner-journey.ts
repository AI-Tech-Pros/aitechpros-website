/** Partner self-serve journey state for dashboard checklist. */

export type PartnerJourneySteps = {
  onboarded: boolean;
  runner_key: boolean;
  first_workflow: boolean;
  sdk_connected: boolean;
};

export type PartnerJourney = {
  tenant_id: string;
  runner_api_key_hint: string | null;
  run_count: number;
  first_workflow_run_id: string | null;
  steps: PartnerJourneySteps;
  next_action: "issue_runner_key" | "run_sample_workflow" | "wire_sdk" | "explore";
  progress_percent: number;
};

export async function getPartnerJourney(
  db: D1Database,
  partnerId: string,
  tenantId: string,
  runnerKeyHint: string | null,
): Promise<PartnerJourney> {
  const keyRow = await db
    .prepare(
      `SELECT COUNT(*) AS count FROM tenant_api_keys
       WHERE partner_id = ? AND revoked_at IS NULL`,
    )
    .bind(partnerId)
    .first<{ count: number }>();

  const hasRunnerKey = (keyRow?.count ?? 0) > 0;

  const firstWorkflow = await db
    .prepare(
      `SELECT run_id FROM runs
       WHERE tenant_id = ? AND workflow_name = 'partner_first_workflow'
       ORDER BY created_at ASC LIMIT 1`,
    )
    .bind(tenantId)
    .first<{ run_id: string }>();

  const sdkRun = await db
    .prepare(
      `SELECT run_id FROM runs
       WHERE tenant_id = ? AND workflow_name != 'partner_first_workflow'
       ORDER BY created_at ASC LIMIT 1`,
    )
    .bind(tenantId)
    .first<{ run_id: string }>();

  const countRow = await db
    .prepare(`SELECT COUNT(*) AS count FROM runs WHERE tenant_id = ?`)
    .bind(tenantId)
    .first<{ count: number }>();

  const steps: PartnerJourneySteps = {
    onboarded: true,
    runner_key: hasRunnerKey,
    first_workflow: Boolean(firstWorkflow),
    sdk_connected: Boolean(sdkRun),
  };

  let next_action: PartnerJourney["next_action"] = "explore";
  if (!steps.runner_key) next_action = "issue_runner_key";
  else if (!steps.first_workflow) next_action = "run_sample_workflow";
  else if (!steps.sdk_connected) next_action = "wire_sdk";

  const completed = [
    steps.onboarded,
    steps.runner_key,
    steps.first_workflow,
    steps.sdk_connected,
  ].filter(Boolean).length;

  return {
    tenant_id: tenantId,
    runner_api_key_hint: runnerKeyHint,
    run_count: countRow?.count ?? 0,
    first_workflow_run_id: firstWorkflow?.run_id ?? null,
    steps,
    next_action,
    progress_percent: Math.round((completed / 4) * 100),
  };
}
