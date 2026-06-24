# Design partner integration cookbook

Wire **one real workflow** to OrchestrateOS during a paid pilot.

**Related:** [Design partner playbook](./design-partner-playbook.md) · [User guide §7](./user-guide.md#7-connect-to-the-live-control-plane) · [PyPI](https://pypi.org/project/resume-engine/)

---

## 1. Install from PyPI

```powershell
pip install "resume_engine[remote]"
pip install "resume_engine[langgraph]"   # if using LangGraph
pip install "resume_engine[crewai]"      # if using CrewAI
```

---

## 2. Environment variables

```powershell
$env:ORCHESTRATEOS_API_URL = "https://orchestrateos-api.nevaquit.workers.dev"
$env:ORCHESTRATEOS_API_KEY = "<runner-key>"
```

| Role | Holder | Permissions |
|------|--------|-------------|
| **runner** | App / CI | Create runs, record steps, resume |
| **operator** | On-call | Compensation, approval, prod ack |
| **auditor** | Compliance | Read audit/replay (authenticated) |

Use **`staging`** for the first integration week:

```python
run = engine.start_run(
    "partner_workflow",
    metadata={"environment": "staging", "partner": "acme"},
)
```

`environment` in metadata is sent to the Worker as the run's deployment environment (`dev` / `staging` / `prod`).

---

## 3. Minimal integration (plain Python)

Replace your in-memory or ad-hoc state with `RemoteCheckpointStore`:

```python
import os
from resume_engine.core.checkpoint_store import ResumeEngine
from resume_engine.storage.remote_backend import RemoteCheckpointStore

API = os.environ["ORCHESTRATEOS_API_URL"]
KEY = os.environ["ORCHESTRATEOS_API_KEY"]

with RemoteCheckpointStore(API, api_key=KEY) as store:
    engine = ResumeEngine(store)
    run = engine.start_run("my_workflow", metadata={"environment": "staging"})

    steps = [
        ("fetch", 0, fetch_fn),
        ("transform", 1, transform_fn),
        ("publish", 2, publish_fn),
    ]

    try:
        engine.execute_workflow(run.run_id, steps, initial_input={})
    except Exception:
        engine.resume(run.run_id, steps, initial_input={})
```

**Runnable starter:** [`resume_engine/examples/partner_plain_python.py`](../../resume_engine/examples/partner_plain_python.py) — partial failure, compensation, resume.

```powershell
$env:ORCHESTRATEOS_API_KEY = "<runner-key>"
python resume_engine/examples/partner_plain_python.py
```

---

## 4. LangGraph (drop-in node wrapper)

No graph topology changes — wrap each node:

```python
from resume_engine.adapters.langgraph_adapter import wrap_langgraph_node

def research_node(state: dict) -> dict:
    return {"findings": llm.invoke(state["query"])}

graph.add_node(
    "research",
    wrap_langgraph_node(engine, run.run_id, "research", 0, research_node),
)
```

On failure, call `engine.resume(run_id, steps)` with the same step list; wrapped nodes skip completed steps via idempotency.

---

## 5. Failure gates (partner week 1 goals)

| Classification | Partner action |
|----------------|----------------|
| `transient` | `engine.resume(...)` (no gate in non-prod) |
| `partial` | `engine.record_compensation(run_id, result={...})` then resume |
| `permanent` | Operator `engine.grant_human_approval(run_id, "ops@company.com")` |
| `prod` env | Operator `ack_prod_resume` via API even for transient failures |

Verify gates in the gate explorer (demo runs) or via API:

```powershell
curl -fsS "https://orchestrateos-api.nevaquit.workers.dev/runs/<RUN_ID>/resume_blockers"
```

---

## 6. Prove value to stakeholders

After the first real failure:

1. **Run ID** — from app logs or `start_run` response  
2. **Audit trail** — `GET /runs/{id}/audit_events`  
3. **Deterministic replay** — `GET /runs/{id}/replay`  
4. **Before/after** — steps completed on resume vs full restart  

Share with compliance: https://orchestrateos.pages.dev/compliance

---

## 7. AI Tech Pros — issuing partner keys

Add keys to Worker secret `API_KEYS_JSON` (via `wrangler secret put`):

```json
{
  "partner-acme-runner-xxxx": "runner",
  "partner-acme-operator-yyyy": "operator"
}
```

Redeploy Worker after rotation. Partner runner key → their `ORCHESTRATEOS_API_KEY`.

---

## 8. Checklist before kickoff call

```powershell
.\resume_engine\scripts\sales_demo_smoke.ps1
```

Partner runs:

```powershell
python -c "from resume_engine import ResumeEngine; print('ok')"
python resume_engine/examples/partner_plain_python.py
```

Both should complete with a `run_id` visible at https://orchestrateos.pages.dev/#gates (Live API tab).
