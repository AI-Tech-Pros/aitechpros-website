/** Multi-reviewer consensus gate for high-risk permanent failures. */

export type ConsensusGate = {
  min_approvers: number;
  failure_key?: string;
  votes?: Record<string, { approved_by: string; note?: string | null; at: string }>;
};

export function consensusFromMetadata(metadata: Record<string, unknown>): ConsensusGate | null {
  const gates = (metadata.gates ?? {}) as Record<string, unknown>;
  const consensus = gates.consensus as ConsensusGate | undefined;
  if (!consensus?.min_approvers || consensus.min_approvers < 2) return null;
  return consensus;
}

export function applyConsensusVote(
  metadata: Record<string, unknown>,
  failureKey: string,
  approvedBy: string,
  note?: string | null,
): { metadata: Record<string, unknown>; voteCount: number; minApprovers: number; satisfied: boolean } {
  const gates = { ...((metadata.gates ?? {}) as Record<string, unknown>) };
  const existing = (gates.consensus ?? {}) as ConsensusGate;
  const minApprovers = existing.min_approvers ?? 2;
  const votes = { ...(existing.votes ?? {}) };
  const reviewer = approvedBy.trim();
  if (!votes[reviewer]) {
    votes[reviewer] = {
      approved_by: reviewer,
      note: note ?? null,
      at: new Date().toISOString(),
    };
  }
  gates.consensus = {
    ...existing,
    min_approvers: minApprovers,
    failure_key: failureKey,
    votes,
  };
  const voteCount = Object.keys(votes).length;
  const satisfied = voteCount >= minApprovers;
  if (satisfied) {
    const approvedAt = new Date().toISOString();
    gates.approvals = {
      ...((gates.approvals ?? {}) as Record<string, unknown>),
      [failureKey]: {
        approved_by: reviewer,
        note: note ?? null,
        at: approvedAt,
        consensus: true,
        vote_count: voteCount,
      },
    };
    gates.human_approval = {
      granted: true,
      failure_key: failureKey,
      approved_by: reviewer,
      approved_at: approvedAt,
      note: note ?? null,
      consensus: true,
      vote_count: voteCount,
    };
  }
  return {
    metadata: { ...metadata, gates },
    voteCount,
    minApprovers,
    satisfied,
  };
}

export function seedConsensusPolicy(metadata: Record<string, unknown>): Record<string, unknown> {
  const min = metadata.consensus_min_approvers;
  if (typeof min !== "number" || min < 2) return metadata;
  const gates = { ...((metadata.gates ?? {}) as Record<string, unknown>) };
  gates.consensus = {
    min_approvers: min,
    votes: {},
  };
  const { consensus_min_approvers: _drop, ...rest } = metadata;
  return { ...rest, gates };
}
