/** Resume gate blocker evaluation — shared by API routes and admin outcomes. */

import { consensusFromMetadata } from "./consensus-gate";
import { parseMetadata, type RunRow, type StepRow } from "./serialize";

export type ResumeBlocker = {
  classification: string;
  step_index: number;
  step_name: string;
  failure_key: string;
  message: string;
  required_action:
    | "compensation"
    | "human_approval"
    | "consensus_approval"
    | "prod_resume_ack";
  consensus_votes?: number;
  consensus_required?: number;
};

export function failureKey(step: StepRow): string {
  return `${step.step_index}:${step.sequence}`;
}

export function lastFailedStep(steps: StepRow[]): StepRow | null {
  for (let i = steps.length - 1; i >= 0; i--) {
    if (steps[i].status === "failed") return steps[i];
  }
  return null;
}

export function getResumeBlockers(run: RunRow, steps: StepRow[]): ResumeBlocker[] {
  if (run.status !== "failed" && run.status !== "paused") return [];
  const failed = lastFailedStep(steps);
  if (!failed?.failure_classification) return [];

  const classification = failed.failure_classification;
  const key = failureKey(failed);
  const gates = (parseMetadata(run.metadata_json).gates ?? {}) as Record<string, unknown>;
  const blockers: ResumeBlocker[] = [];

  if (classification === "partial") {
    if (!gates.compensations || !(gates.compensations as Record<string, unknown>)[key]) {
      blockers.push({
        classification,
        step_index: failed.step_index,
        step_name: failed.step_name,
        failure_key: key,
        message: failed.error_message ?? "Partial failure requires compensation",
        required_action: "compensation",
      });
    }
  } else if (classification === "permanent") {
    const metadata = parseMetadata(run.metadata_json);
    const consensus = consensusFromMetadata(metadata);
    if (consensus) {
      const voteCount = Object.keys(consensus.votes ?? {}).length;
      const minApprovers = consensus.min_approvers;
      if (voteCount < minApprovers) {
        blockers.push({
          classification,
          step_index: failed.step_index,
          step_name: failed.step_name,
          failure_key: key,
          message:
            failed.error_message ??
            `Permanent failure requires ${minApprovers} reviewer approvals (${voteCount}/${minApprovers})`,
          required_action: "consensus_approval",
          consensus_votes: voteCount,
          consensus_required: minApprovers,
        });
      }
    } else {
      const human = gates.human_approval as
        | { failure_key?: string; granted?: boolean }
        | undefined;
      const hasApproval =
        (gates.approvals as Record<string, unknown> | undefined)?.[key] ||
        (human?.failure_key === key && human?.granted);
      if (!hasApproval) {
        blockers.push({
          classification,
          step_index: failed.step_index,
          step_name: failed.step_name,
          failure_key: key,
          message: failed.error_message ?? "Permanent failure requires human approval",
          required_action: "human_approval",
        });
      }
    }
  }

  if (blockers.length === 0 && (run.environment ?? "dev") === "prod" && failed) {
    const prodAck = gates.prod_resume_ack as { granted?: boolean } | undefined;
    if (!prodAck?.granted) {
      blockers.push({
        classification,
        step_index: failed.step_index,
        step_name: failed.step_name,
        failure_key: key,
        message: "Production resume requires operator acknowledgment",
        required_action: "prod_resume_ack",
      });
    }
  }

  return blockers;
}

export function runGateSummary(run: RunRow, steps: StepRow[]) {
  const blockers = getResumeBlockers(run, steps);
  return {
    can_resume: blockers.length === 0,
    blocker_count: blockers.length,
    blockers,
  };
}
