"""FastAPI service exposing resume_engine operations."""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from resume_engine.api.config import Settings
from resume_engine.core.checkpoint_store import CheckpointStore, ResumeEngine
from resume_engine.core.resume_gates import ResumeBlockedError
from resume_engine.storage.sqlite_backend import SQLiteCheckpointStore


def build_store(database_url: str) -> CheckpointStore:
    """Create the checkpoint store for the configured database URL."""
    if database_url.startswith("postgresql"):
        from resume_engine.storage.postgres_backend import PostgresCheckpointStore

        return PostgresCheckpointStore(database_url)
    return SQLiteCheckpointStore(database_url)


def create_app(settings: Settings | None = None) -> FastAPI:
    """Application factory — used by uvicorn, tests, and Docker."""
    cfg = settings or Settings.from_env()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        store = build_store(cfg.database_url)
        app.state.engine = ResumeEngine(store)
        app.state.store = store
        yield
        store.close()

    app = FastAPI(
        title="OrchestrateOS Resume Engine",
        description="Deterministic execution layer for multi-step agent workflows",
        version="0.1.0",
        lifespan=lifespan,
    )

    cors_origins = os.environ.get(
        "CORS_ORIGINS",
        "https://orchestrateos.aitechpros.ai,http://localhost:3001,http://127.0.0.1:3001",
    ).split(",")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[o.strip() for o in cors_origins if o.strip()],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    def health() -> dict[str, str]:
        """Health check for load balancers and container orchestrators."""
        return {"status": "ok", "service": "orchestrateos-api"}

    @app.get("/")
    def root() -> dict[str, str]:
        """Service metadata."""
        return {
            "product": "OrchestrateOS",
            "component": "resume_engine-api",
            "docs": "/docs",
            "health": "/health",
        }

    @app.post("/start_run", response_model=StartRunResponse)
    def start_run(request: StartRunRequest, req: Request) -> StartRunResponse:
        """Create a new workflow run."""
        engine: ResumeEngine = req.app.state.engine
        run = engine.start_run(request.workflow_name, metadata=request.metadata)
        return StartRunResponse(run_id=run.run_id, status=run.status.value)

    @app.get("/runs/{run_id}/status", response_model=RunStatusResponse)
    def get_run_status(run_id: str, req: Request) -> RunStatusResponse:
        """Get the current status of a run."""
        engine: ResumeEngine = req.app.state.engine
        run = engine.get_run_status(run_id)
        if run is None:
            raise HTTPException(status_code=404, detail=f"Run not found: {run_id}")
        from resume_engine.core.step_record import StepStatus

        completed = sum(1 for s in run.steps if s.status == StepStatus.COMPLETED)
        blockers = engine.get_resume_blockers(run_id)
        return RunStatusResponse(
            run_id=run.run_id,
            workflow_name=run.workflow_name,
            status=run.status.value,
            steps_completed=completed,
            last_completed_step=run.last_completed_step_index(),
            resume_from_index=run.resume_from_index(),
            can_resume=len(blockers) == 0,
            resume_blockers=[b.to_dict() for b in blockers],
        )

    @app.post("/resume", response_model=RunStatusResponse)
    def resume_run(request: ResumeRequest, req: Request) -> RunStatusResponse:
        """Return resume metadata for a failed or paused run.

        Step definitions are supplied by the client SDK; this endpoint exposes
        the checkpoint index to resume from.
        """
        engine: ResumeEngine = req.app.state.engine
        run = engine.get_run_status(request.run_id)
        if run is None:
            raise HTTPException(status_code=404, detail=f"Run not found: {request.run_id}")

        blockers = engine.get_resume_blockers(request.run_id)
        if blockers:
            raise HTTPException(
                status_code=409,
                detail={
                    "message": "Resume blocked by failure gates",
                    "blockers": [b.to_dict() for b in blockers],
                },
            )

        return RunStatusResponse(
            run_id=run.run_id,
            workflow_name=run.workflow_name,
            status=run.status.value,
            steps_completed=len([s for s in run.steps if s.status.value == "completed"]),
            last_completed_step=run.last_completed_step_index(),
            resume_from_index=run.resume_from_index(),
            can_resume=True,
            resume_blockers=[],
        )

    @app.get("/runs/{run_id}/resume_blockers", response_model=ResumeBlockersResponse)
    def list_resume_blockers(run_id: str, req: Request) -> ResumeBlockersResponse:
        """List actions required before this run can resume."""
        engine: ResumeEngine = req.app.state.engine
        try:
            blockers = engine.get_resume_blockers(run_id)
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        return ResumeBlockersResponse(
            run_id=run_id,
            can_resume=len(blockers) == 0,
            blockers=[b.to_dict() for b in blockers],
        )

    @app.post("/runs/{run_id}/compensate", response_model=RunStatusResponse)
    def record_compensation(
        run_id: str,
        request: CompensateRequest,
        req: Request,
    ) -> RunStatusResponse:
        """Record compensation for a partial failure (external / manual ops)."""
        engine: ResumeEngine = req.app.state.engine
        try:
            run = engine.record_compensation(
                run_id,
                result=request.result,
                note=request.note,
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

        blockers = engine.get_resume_blockers(run_id)
        return RunStatusResponse(
            run_id=run.run_id,
            workflow_name=run.workflow_name,
            status=run.status.value,
            steps_completed=len([s for s in run.steps if s.status.value == "completed"]),
            last_completed_step=run.last_completed_step_index(),
            resume_from_index=run.resume_from_index(),
            can_resume=len(blockers) == 0,
            resume_blockers=[b.to_dict() for b in blockers],
        )

    @app.post("/runs/{run_id}/approve", response_model=RunStatusResponse)
    def grant_approval(
        run_id: str,
        request: ApproveRequest,
        req: Request,
    ) -> RunStatusResponse:
        """Grant human approval to resume after a permanent failure."""
        engine: ResumeEngine = req.app.state.engine
        try:
            run = engine.grant_human_approval(
                run_id,
                request.approved_by,
                note=request.note,
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

        return RunStatusResponse(
            run_id=run.run_id,
            workflow_name=run.workflow_name,
            status=run.status.value,
            steps_completed=len([s for s in run.steps if s.status.value == "completed"]),
            last_completed_step=run.last_completed_step_index(),
            resume_from_index=run.resume_from_index(),
            can_resume=True,
            resume_blockers=[],
        )

    @app.get("/runs/{run_id}/audit_log", response_model=AuditLogResponse)
    def get_audit_log(run_id: str, req: Request) -> AuditLogResponse:
        """Return the deterministic audit trace for a run."""
        engine: ResumeEngine = req.app.state.engine
        try:
            trace = engine.get_audit_log(run_id)
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        return AuditLogResponse(run_id=run_id, audit_trace=trace)

    return app


class StartRunRequest(BaseModel):
    workflow_name: str = Field(..., description="Name of the workflow to execute")
    metadata: dict[str, Any] = Field(default_factory=dict)


class StartRunResponse(BaseModel):
    run_id: str
    status: str


class RunStatusResponse(BaseModel):
    run_id: str
    workflow_name: str
    status: str
    steps_completed: int
    last_completed_step: int | None
    resume_from_index: int
    can_resume: bool = True
    resume_blockers: list[dict[str, Any]] = Field(default_factory=list)


class ResumeBlockersResponse(BaseModel):
    run_id: str
    can_resume: bool
    blockers: list[dict[str, Any]]


class CompensateRequest(BaseModel):
    result: dict[str, Any] = Field(default_factory=dict)
    note: str | None = None


class ApproveRequest(BaseModel):
    approved_by: str = Field(..., min_length=1)
    note: str | None = None


class ResumeRequest(BaseModel):
    run_id: str


class AuditLogResponse(BaseModel):
    run_id: str
    audit_trace: str


app = create_app()
