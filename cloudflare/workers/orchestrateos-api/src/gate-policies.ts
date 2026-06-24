/** Tenant-scoped gate policy defaults applied at run creation. */

export type TenantGatePolicy = {
  prod_requires_ack: boolean;
  permanent_consensus_min: number;
  partial_requires_compensation: boolean;
};

export const DEFAULT_GATE_POLICY: TenantGatePolicy = {
  prod_requires_ack: true,
  permanent_consensus_min: 0,
  partial_requires_compensation: true,
};

export function parseGatePolicy(json: string | null | undefined): TenantGatePolicy {
  if (!json?.trim()) return { ...DEFAULT_GATE_POLICY };
  try {
    const raw = JSON.parse(json) as Partial<TenantGatePolicy>;
    return {
      prod_requires_ack: raw.prod_requires_ack ?? DEFAULT_GATE_POLICY.prod_requires_ack,
      permanent_consensus_min:
        typeof raw.permanent_consensus_min === "number" && raw.permanent_consensus_min >= 0
          ? Math.floor(raw.permanent_consensus_min)
          : DEFAULT_GATE_POLICY.permanent_consensus_min,
      partial_requires_compensation:
        raw.partial_requires_compensation ?? DEFAULT_GATE_POLICY.partial_requires_compensation,
    };
  } catch {
    return { ...DEFAULT_GATE_POLICY };
  }
}

export async function getTenantGatePolicy(
  db: D1Database,
  tenantSlug: string,
): Promise<TenantGatePolicy> {
  const row = await db
    .prepare(`SELECT gate_policy_json FROM design_partners WHERE slug = ?`)
    .bind(tenantSlug)
    .first<{ gate_policy_json: string | null }>();
  return parseGatePolicy(row?.gate_policy_json);
}

export function applyTenantGatePolicy(
  metadata: Record<string, unknown>,
  policy: TenantGatePolicy,
): Record<string, unknown> {
  const next = { ...metadata };
  next.gate_policy = policy;
  if (policy.permanent_consensus_min >= 2) {
    next.consensus_min_approvers = policy.permanent_consensus_min;
    const gates = { ...((next.gates ?? {}) as Record<string, unknown>) };
    gates.consensus = {
      min_approvers: policy.permanent_consensus_min,
      votes: {},
      source: "tenant_policy",
    };
    next.gates = gates;
  }
  return next;
}
