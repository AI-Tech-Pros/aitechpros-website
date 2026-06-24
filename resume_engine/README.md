# OrchestrateOS — resume_engine

**Deterministic execution for multi-step agent workflows.**

`resume_engine` is the core execution layer behind [OrchestrateOS](https://orchestrateos.aitechpros.ai) — a framework-agnostic library that wraps LangChain, LangGraph, CrewAI, or plain Python workflows and guarantees that a failed run resumes from its last completed step instead of restarting from zero.

## The Problem

| Framework | Failure behavior |
|-----------|------------------|
| CrewAI | Restarts entire workflow from step 1 |
| LangChain | No built-in checkpointing (manual LangGraph required) |
| Microsoft Agent Framework | Session state locked to Azure |

## Core Primitives

1. **State persistence** — Every step's input, output, and state is written to durable storage immediately after completion.
2. **Idempotent step execution** — Each step carries a generated idempotency key; side effects cannot fire twice on resume.
3. **Resume capability** — `resume(run_id)` continues from the last successfully completed step.
4. **Deterministic replay** — Reproduce audit-ready, byte-for-byte identical traces from recorded inputs.
5. **Failure classification** — Failures tagged as `transient`, `permanent`, or `partial`.

## Installation

```bash
# PyPI
pip install resume_engine

# From source (repo root)
pip install -e .

# With FastAPI service
pip install -e ".[api]"

# With framework adapters
pip install -e ".[langgraph,crewai]"

# Development
pip install -e ".[dev]"

# Remote checkpoint store (Python SDK → Cloudflare Worker + D1)
pip install -e ".[remote]"
```

## Quickstart — Remote control plane

Persist runs to the live OrchestrateOS API (same D1 database as the gate explorer):

```python
from resume_engine.core.checkpoint_store import ResumeEngine
from resume_engine.storage.remote_backend import RemoteCheckpointStore

API_URL = "https://orchestrateos-api.nevaquit.workers.dev"

with RemoteCheckpointStore(API_URL) as store:
    engine = ResumeEngine(store)
    run = engine.start_run("my_pipeline")
    # execute_step / execute_workflow / resume — same API as SQLite
```

Demo script (injects transient failure, resumes, prints run ID for the gate explorer):

```bash
python resume_engine/demo_remote_pipeline.py
```

## Quickstart — Plain Python

```python
from resume_engine import ResumeEngine, SQLiteCheckpointStore

store = SQLiteCheckpointStore("sqlite:///my_workflow.db")
engine = ResumeEngine(store)

run = engine.start_run("my_pipeline")

steps = [
    ("fetch", lambda inp, key: {"data": fetch(inp["url"])}),
    ("transform", lambda inp, key: {"result": transform(inp["data"])}),
    ("publish", lambda inp, key: {"ok": publish(inp["result"])}),
]

try:
    engine.execute_workflow(run.run_id, steps, initial_input={"url": "https://api.example.com"})
except Exception:
    # Failure at any step — resume picks up where it left off
    engine.resume(run.run_id, steps, initial_input={"url": "https://api.example.com"})

print(engine.get_audit_log(run.run_id))
```

## Quickstart — LangGraph

Wrap existing nodes without changing your graph definition:

```python
from langgraph.graph import StateGraph
from resume_engine import ResumeEngine, SQLiteCheckpointStore
from resume_engine.adapters.langgraph_adapter import wrap_langgraph_node

store = SQLiteCheckpointStore()
engine = ResumeEngine(store)
run = engine.start_run("research_graph")

def research_node(state: dict) -> dict:
    return {"findings": llm.invoke(state["query"])}

def summarize_node(state: dict) -> dict:
    return {"summary": llm.invoke(state["findings"])}

graph = StateGraph(dict)
graph.add_node("research", wrap_langgraph_node(engine, run.run_id, "research", 0, research_node))
graph.add_node("summarize", wrap_langgraph_node(engine, run.run_id, "summarize", 1, summarize_node))
# ... add edges and compile as usual
```

## Quickstart — CrewAI Flow

```python
from resume_engine import ResumeEngine, SQLiteCheckpointStore
from resume_engine.adapters.crewai_adapter import wrap_crewai_task

store = SQLiteCheckpointStore()
engine = ResumeEngine(store)
run = engine.start_run("content_flow")

class ContentFlow(Flow):
    @start()
    def ingest(self):
        return wrap_crewai_task(
            engine, run.run_id, "ingest", 0,
            lambda state: {"raw": scrape(state["url"])}
        )(self.state)

    @listen(ingest)
    def publish(self, state):
        return wrap_crewai_task(
            engine, run.run_id, "publish", 1,
            lambda s: {"published": post(s["raw"])}
        )(state)
```

## Decorator API

```python
from resume_engine.adapters.decorator import durable_step

@durable_step(engine, run.run_id, "enrich", 2)
def enrich(state: dict) -> dict:
    return {"enriched": model.run(state)}

result = enrich.execute({"input": "data"})
```

## FastAPI Service

```bash
pip install -e ".[api]"
uvicorn resume_engine.api.main:app --host 0.0.0.0 --port 8000
```

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Load balancer health check |
| `/start_run` | POST | Create a new run |
| `/runs/{run_id}/status` | GET | Get run status |
| `/runs/{run_id}/resume_blockers` | GET | List compensation/approval gates |
| `/runs/{run_id}/compensate` | POST | Record partial-failure compensation |
| `/runs/{run_id}/approve` | POST | Grant human approval (permanent failures) |
| `/runs/{run_id}/audit_log` | GET | Deterministic audit trace |

### Docker (recommended for deploy)

From the repository root:

```bash
# SQLite-backed API with persistent volume (default)
docker compose -f resume_engine/docker-compose.yml up --build

# Postgres-backed production stack
docker compose -f resume_engine/docker-compose.yml --profile postgres up --build api-postgres
```

API available at `http://localhost:8000` · OpenAPI docs at `/docs`.

Environment variables (see `resume_engine/.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:////data/resume_engine.db` | SQLite or `postgresql+psycopg2://...` |
| `PORT` | `8000` | HTTP port (Cloud Run sets this automatically) |
| `LOG_LEVEL` | `info` | Uvicorn log level |

Build the image manually:

```bash
docker build -f resume_engine/Dockerfile -t orchestrateos-api:latest .
docker run --rm -p 8000:8000 -v orchestrateos_data:/data orchestrateos-api:latest
```

### Cloud Run

**Deploy order:** site on Namecheap → API on Cloud Run/Docker → DNS subdomains last.

1. Push the image to Artifact Registry or GHCR (`ghcr.io/<org>/orchestrateos-api`).
2. Store `DATABASE_URL` in Secret Manager as `orchestrateos-database-url`.
3. Apply `deploy/cloud-run.yaml` (replace `PROJECT_ID` and `REGION`).

Or use the helper script (requires `gcloud`):

```powershell
.\resume_engine\scripts\deploy_cloud_run.ps1 -ProjectId YOUR_GCP_PROJECT
```

Smoke test after deploy:

```powershell
.\resume_engine\scripts\smoke_test_api.ps1 -BaseUrl https://YOUR_API_URL
```

CI builds and pushes to GHCR on every push to `main` via `.github/workflows/orchestrateos-api.yml`.

**Production (Cloudflare — no custom domain required)**

| URL | Purpose |
|-----|---------|
| https://orchestrateos.pages.dev | Product landing (gate explorer + docs) |
| https://orchestrateos-api.nevaquit.workers.dev | Control plane API (Workers + D1) |

Set `CORS_ORIGINS` on the Worker so the landing page can call the API from the browser (see `cloudflare/workers/orchestrateos-api/wrangler.toml`).

Override locally with `VITE_ORCHESTRATEOS_API_URL` and `VITE_SITE_URL` (see `.env.example`).

## Storage Backends

```python
# Local development
from resume_engine.storage.sqlite_backend import SQLiteCheckpointStore
store = SQLiteCheckpointStore("sqlite:///resume_engine.db")

# Production
from resume_engine.storage.postgres_backend import PostgresCheckpointStore
store = PostgresCheckpointStore("postgresql+psycopg2://user:pass@host/db")
```

## Demo

```bash
python resume_engine/demo_restart_vs_resume.py
```

Simulates a 50-step workflow with failure at step 47 and compares naive restart vs resume_engine.

## Running Tests

```bash
pip install -e ".[dev,api]"
pytest resume_engine/tests -v
```

## Failure Classification

```python
from resume_engine import TransientStepError, PermanentStepError, PartialStepError

# Safe to auto-retry
raise TransientStepError("API timeout")

# Requires human intervention
raise PermanentStepError("Invalid API key")

# Requires compensation before retry
raise PartialStepError("Email sent but DB write failed")
```

### Resume gates

| Classification | Gate before `resume()` |
|----------------|------------------------|
| `transient` | None — resume immediately |
| `partial` | Run `execute_compensation()` or `record_compensation()` |
| `permanent` | Call `grant_human_approval(approved_by=...)` |

```python
from resume_engine import ResumeBlockedError

try:
    engine.resume(run_id, steps)
except ResumeBlockedError as exc:
    for blocker in exc.blockers:
        print(blocker.required_action)  # "compensation" or "human_approval"

# Partial failure — undo side effects first
engine.execute_compensation(
    run_id,
    lambda inp, key: {"reverted_email_id": undo_send(inp["email_id"])},
)

# Permanent failure — human operator clears the gate
engine.grant_human_approval(run_id, "ops@company.com", note="API key rotated")

engine.resume(run_id, steps)
```

Gates are keyed per failure event (`step_index:sequence`), so a re-failure after resume requires fresh compensation or approval.

## Project Layout

```
resume_engine/
  core/           # Run, StepRecord, ResumeEngine, idempotency, failure classifier
  adapters/       # LangGraph, CrewAI, @durable_step decorator
  api/            # FastAPI service
  storage/        # SQLite and Postgres backends
  tests/
```

## License

MIT — [AI Tech Pros](https://aitechpros.ai)
