-- Phase 2: kernel ingress, tool invocations, LLM usage / cost breaker

CREATE TABLE IF NOT EXISTS ingress_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('webhook', 'queue', 'human')),
  source_id TEXT,
  payload_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  run_id TEXT,
  created_at TEXT NOT NULL,
  processed_at TEXT,
  FOREIGN KEY (run_id) REFERENCES runs(run_id)
);

CREATE INDEX IF NOT EXISTS idx_ingress_events_tenant_status ON ingress_events(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_ingress_events_run_id ON ingress_events(run_id);

CREATE TABLE IF NOT EXISTS kernel_tool_invocations (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  step_index INTEGER NOT NULL,
  tool_name TEXT NOT NULL,
  input_json TEXT NOT NULL DEFAULT '{}',
  output_json TEXT,
  status TEXT NOT NULL CHECK (status IN ('completed', 'failed')),
  error_message TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (run_id) REFERENCES runs(run_id)
);

CREATE INDEX IF NOT EXISTS idx_kernel_tools_run_id ON kernel_tool_invocations(run_id);

CREATE TABLE IF NOT EXISTS llm_usage (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  run_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  estimated_cost_usd REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (run_id) REFERENCES runs(run_id)
);

CREATE INDEX IF NOT EXISTS idx_llm_usage_run_id ON llm_usage(run_id);
CREATE INDEX IF NOT EXISTS idx_llm_usage_tenant_id ON llm_usage(tenant_id);

CREATE TABLE IF NOT EXISTS tenant_llm_budgets (
  tenant_id TEXT PRIMARY KEY,
  budget_usd REAL NOT NULL DEFAULT 0.10,
  spent_usd REAL NOT NULL DEFAULT 0,
  period_start TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
