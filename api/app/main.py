import asyncio
import json
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from uuid import UUID, uuid4
from urllib.parse import quote

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request, status
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from app.github.client import GithubAPIError, GithubClient
from app.github.repositories import GithubRepoService
from app.github.connections import get_github_token, list_user_repositories
from app.github.routes import router as github_router
from app.config import settings
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel
from sqlalchemy import or_, select, text, update

from app.auth.dependencies import require_user
from app.auth.models import User
from app.auth.routes import router as auth_router
from app.events.database import SessionFactory, engine
from app.events.models import AgentApproval, AgentRun, Base, Deployment, Incident
from app.events.runner import TERMINAL_STATUSES, run_agent
from app.events.schemas import (
    AgentRunResponse,
    AgentRunListResponse,
    AgentApprovalResponse,
    AgentApprovalStatus,
    CreateRunResponse,
    DeploymentCreateRequest,
    DeploymentEnvironment,
    DeploymentListResponse,
    DeploymentResponse,
    DeploymentStatus,
    IncidentCreateRequest,
    IncidentListResponse,
    IncidentResponse,
    IncidentStatus,
    IncidentStatusRequest,
    ProjectListResponse,
    ProjectRepositoryResponse,
    ProjectResponse,
    RunEventResponse,
    RunStatus,
)
from app.events.service import RunEventService


@asynccontextmanager
async def lifespan(application: FastAPI):
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
        await connection.execute(
            text(
                "ALTER TABLE agent_runs "
                "ADD COLUMN IF NOT EXISTS user_id UUID "
                "REFERENCES users(id) ON DELETE SET NULL"
            )
        )
        await connection.execute(
            text(
                "ALTER TABLE agent_runs "
                "ADD COLUMN IF NOT EXISTS prompt TEXT"
            )
        )
        await connection.execute(
            text(
                "ALTER TABLE agent_runs "
                "ADD COLUMN IF NOT EXISTS project_id VARCHAR(255)"
            )
        )
        await connection.execute(
            text(
                "ALTER TABLE agent_runs "
                "ADD COLUMN IF NOT EXISTS project_name VARCHAR(160)"
            )
        )
        await connection.execute(
            text(
                "ALTER TABLE agent_runs "
                "ADD COLUMN IF NOT EXISTS repository_full_name VARCHAR(255)"
            )
        )
        await connection.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_agent_runs_project_id "
                "ON agent_runs (project_id)"
            )
        )
        await connection.execute(
            text(
                "ALTER TABLE incidents "
                "ADD COLUMN IF NOT EXISTS repository_full_name VARCHAR(255)"
            )
        )
        await connection.execute(
            text(
                "ALTER TABLE deployments "
                "ADD COLUMN IF NOT EXISTS deployed_by VARCHAR(320)"
            )
        )
        await connection.execute(
            text(
                "UPDATE deployments "
                "SET deployed_by = users.email "
                "FROM users "
                "WHERE deployments.user_id = users.id "
                "AND deployments.deployed_by IS NULL"
            )
        )
        await connection.execute(
            text(
                "UPDATE deployments "
                "SET deployed_by = 'Unknown user' "
                "WHERE deployed_by IS NULL"
            )
        )
        await connection.execute(
            text(
                "ALTER TABLE deployments "
                "ALTER COLUMN deployed_by SET NOT NULL"
            )
        )

    async with SessionFactory() as session:
        result = await session.scalars(
            select(AgentRun).where(
                AgentRun.status.in_(
                    [
                        RunStatus.STARTED.value,
                        RunStatus.RUNNING.value,
                        RunStatus.PAUSED.value,
                    ]
                )
            )
        )
        service = RunEventService(session)
        for run in result:
            await service.append_event(
                run,
                RunStatus.FAILED,
                current_run_step="Run interrupted by a server restart",
                error="The server restarted before this run completed.",
            )
        await session.commit()
        await session.execute(
            update(AgentApproval)
            .where(AgentApproval.status == AgentApprovalStatus.PENDING.value)
            .values(
                status=AgentApprovalStatus.CANCELLED.value,
                decided_at=datetime.now(UTC),
            )
        )
        await session.commit()

    application.state.run_tasks = {}
    application.state.run_resume_gates = {}
    try:
        yield
    finally:
        tasks = list(application.state.run_tasks.values())
        for task in tasks:
            task.cancel()
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
        await engine.dispose()

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    lifespan=lifespan,
)
frontend_origins = {
    origin.strip()
    for origin in settings.frontend_origins.split(",")
    if origin.strip()
}
frontend_origins.add(settings.frontend_url.rstrip("/"))
if frontend_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=sorted(frontend_origins),
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=["Content-Type", "Last-Event-ID"],
    )
app.include_router(auth_router)
app.include_router(github_router)

class ChatRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    message: str
    project_id: str | None = Field(default=None, max_length=255)
    project_name: str | None = Field(default=None, max_length=160)
    repository_full_name: str | None = Field(default=None, max_length=255)

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": settings.app_name,
        "environment": settings.environment,
    }


async def _list_projects(user: User) -> list[ProjectResponse]:
    try:
        repositories = await list_user_repositories(user.id)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except GithubAPIError as exc:
        raise HTTPException(
            status_code=502,
            detail="Could not load projects from GitHub.",
        ) from exc

    return [
        ProjectResponse(
            id=repository["id"],
            name=repository["name"],
            repository=ProjectRepositoryResponse(
                full_name=repository["full_name"],
                default_branch=repository["default_branch"],
            ),
            description=repository["description"],
            environments=[],
            created_at=repository["created_at"],
        )
        for repository in repositories
    ]


@app.get("/project", response_model=ProjectListResponse)
async def list_projects(user: User = Depends(require_user)):
    projects = await _list_projects(user)
    return ProjectListResponse(data=projects, count=len(projects))


@app.get("/project/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    user: User = Depends(require_user),
):
    projects = await _list_projects(user)
    project = next((item for item in projects if item.id == project_id), None)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def _parse_github_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return parsed if parsed.tzinfo is not None else parsed.replace(tzinfo=UTC)


async def _dispatch_deployment(
    deployment: Deployment,
    github_token: str,
) -> None:
    owner, repository = deployment.repository_full_name.split("/", 1)
    workflow_path = (
        f"/repos/{quote(owner, safe='')}/{quote(repository, safe='')}"
        f"/actions/workflows/{quote(deployment.workflow_file, safe='')}/dispatches"
    )
    try:
        await GithubClient(github_token).post(
            workflow_path,
            {
                "ref": deployment.ref,
                "inputs": {
                    "forgeops_deployment_id": str(deployment.id),
                    "version": deployment.version,
                    "environment": deployment.environment,
                },
            },
        )
    except GithubAPIError as exc:
        async with SessionFactory() as session:
            stored = await session.get(Deployment, deployment.id)
            if stored is not None:
                stored.status = DeploymentStatus.FAILED.value
                stored.error = "GitHub Actions rejected the workflow dispatch."
                await session.commit()
        raise HTTPException(
            status_code=502,
            detail="GitHub Actions could not start the deployment workflow.",
        ) from exc


def _apply_github_deployment_run(
    deployment: Deployment,
    github_run: dict,
) -> bool:
    deployment.github_run_id = github_run["id"]
    deployment.github_run_url = github_run.get("html_url")
    deployment.started_at = _parse_github_datetime(github_run.get("run_started_at"))
    if github_run.get("status") == "completed":
        conclusion = github_run.get("conclusion")
        deployment.completed_at = _parse_github_datetime(
            github_run.get("updated_at")
        )
        if conclusion == "success":
            deployment.status = DeploymentStatus.SUCCESSFUL.value
        elif conclusion == "cancelled":
            deployment.status = DeploymentStatus.CANCELLED.value
        else:
            deployment.status = DeploymentStatus.FAILED.value
            deployment.error = f"Workflow completed with conclusion: {conclusion or 'unknown'}."
    else:
        deployment.status = DeploymentStatus.IN_PROGRESS.value
    return True


async def _refresh_deployments_status(
    deployments: list[Deployment],
    github_token: str,
) -> bool:
    by_repository: dict[str, list[Deployment]] = {}
    for deployment in deployments:
        if deployment.status in {
            DeploymentStatus.QUEUED.value,
            DeploymentStatus.IN_PROGRESS.value,
        }:
            by_repository.setdefault(
                deployment.repository_full_name,
                [],
            ).append(deployment)

    changed = False
    for full_name, repository_deployments in by_repository.items():
        owner, repository = full_name.split("/", 1)
        runs_path = (
            f"/repos/{quote(owner, safe='')}/{quote(repository, safe='')}"
            "/actions/runs"
        )
        earliest_date = min(
            deployment.created_at.date() for deployment in repository_deployments
        )
        try:
            payload = await GithubClient(github_token).get(
                runs_path,
                params={
                    "event": "workflow_dispatch",
                    "per_page": 100,
                    "created": f">={earliest_date.isoformat()}",
                },
            )
        except GithubAPIError as exc:
            raise HTTPException(
                status_code=502,
                detail="Could not refresh deployment status from GitHub Actions.",
            ) from exc

        runs_by_title = {
            run.get("display_title"): run
            for run in payload.get("workflow_runs", [])
            if run.get("display_title")
        }
        for deployment in repository_deployments:
            github_run = runs_by_title.get(
                f"ForgeOps deployment {deployment.id}"
            )
            if github_run is not None:
                changed = _apply_github_deployment_run(
                    deployment,
                    github_run,
                ) or changed
    return changed


@app.get("/deployments", response_model=DeploymentListResponse)
async def list_deployments(
    project_id: str | None = Query(default=None, max_length=255),
    user: User = Depends(require_user),
):
    try:
        github_token = await get_github_token(user.id)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    async with SessionFactory() as session:
        query = select(Deployment).where(Deployment.user_id == user.id)
        if project_id is not None:
            query = query.where(Deployment.project_id == project_id)
        result = await session.scalars(
            query.order_by(Deployment.created_at.desc()).limit(100)
        )
        deployments = list(result)
        changed = await _refresh_deployments_status(deployments, github_token)
        if changed:
            await session.commit()
        return DeploymentListResponse(deployments=deployments)


@app.post(
    "/deployments",
    response_model=DeploymentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_deployment(
    request: DeploymentCreateRequest,
    user: User = Depends(require_user),
):
    try:
        github_token = await get_github_token(user.id)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    projects = await _list_projects(user)
    project = next(
        (item for item in projects if item.id == request.project_id),
        None,
    )
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    deployment = Deployment(
        id=uuid4(),
        user_id=user.id,
        project_id=project.id,
        project_name=project.name,
        repository_full_name=project.repository.full_name,
        deployed_by=user.email,
        workflow_file=request.workflow_file,
        ref=request.ref,
        version=request.version,
        environment=request.environment.value,
        status=(
            DeploymentStatus.PENDING_APPROVAL.value
            if request.environment is DeploymentEnvironment.PRODUCTION
            else DeploymentStatus.QUEUED.value
        ),
    )
    async with SessionFactory() as session:
        session.add(deployment)
        await session.commit()
        await session.refresh(deployment)

    if deployment.status != DeploymentStatus.PENDING_APPROVAL.value:
        await _dispatch_deployment(deployment, github_token)
    return deployment


@app.post(
    "/deployments/{deployment_id}/approve",
    response_model=DeploymentResponse,
)
async def approve_deployment(
    deployment_id: UUID,
    user: User = Depends(require_user),
):
    try:
        github_token = await get_github_token(user.id)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    async with SessionFactory() as session:
        deployment = await session.scalar(
            select(Deployment)
            .where(
                Deployment.id == deployment_id,
                Deployment.user_id == user.id,
            )
            .with_for_update()
        )
        if deployment is None:
            raise HTTPException(status_code=404, detail="Deployment not found")
        if deployment.status != DeploymentStatus.PENDING_APPROVAL.value:
            raise HTTPException(
                status_code=409,
                detail="Only deployments awaiting approval can be approved.",
            )
        deployment.approved_at = datetime.now(UTC)
        deployment.status = DeploymentStatus.QUEUED.value
        await session.commit()
        await session.refresh(deployment)

    await _dispatch_deployment(deployment, github_token)
    return deployment


def _append_incident_timeline(incident: Incident, event: str) -> None:
    incident.timeline = [
        *incident.timeline,
        {"time": datetime.now(UTC).isoformat(), "event": event},
    ]


@app.get("/incidents", response_model=IncidentListResponse)
async def list_incidents(user: User = Depends(require_user)):
    async with SessionFactory() as session:
        result = await session.scalars(
            select(Incident)
            .where(Incident.user_id == user.id)
            .order_by(Incident.updated_at.desc())
        )
        return IncidentListResponse(incidents=list(result))


@app.post(
    "/incidents",
    response_model=IncidentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def declare_incident(
    request: IncidentCreateRequest,
    user: User = Depends(require_user),
):
    now = datetime.now(UTC)
    incident = Incident(
        user_id=user.id,
        project_id=request.project_id,
        project_name=request.project_name,
        repository_full_name=request.repository_full_name,
        title=request.title.strip(),
        service=request.service.strip(),
        description=request.description.strip() if request.description else None,
        severity=request.severity.value,
        status=IncidentStatus.OPEN.value,
        timeline=[
            {"time": now.isoformat(), "event": "Incident declared manually"}
        ],
    )
    async with SessionFactory() as session:
        session.add(incident)
        await session.commit()
        await session.refresh(incident)
        return incident


@app.post("/incidents/{incident_id}/investigate", response_model=IncidentResponse)
async def investigate_incident(
    incident_id: UUID,
    http_request: Request,
    user: User = Depends(require_user),
):
    async with SessionFactory() as session:
        result = await session.execute(
            select(Incident)
            .where(Incident.id == incident_id, Incident.user_id == user.id)
            .with_for_update()
        )
        incident = result.scalar_one_or_none()
        if incident is None:
            raise HTTPException(status_code=404, detail="Incident not found")
        if incident.status == IncidentStatus.RESOLVED.value:
            raise HTTPException(
                status_code=409,
                detail="Reopen the incident before starting an investigation.",
            )

        prompt = (
            f"Investigate this manually declared incident for service "
            f"{incident.service}: {incident.title}."
        )
        if incident.description:
            prompt += f" Incident details: {incident.description}"
        prompt += (
            " Inspect the associated GitHub repository if available. "
            "Do not make changes or execute remediation; report evidence, "
            "likely root cause, confidence, and safe recommended next steps."
        )
        run_request = ChatRequest(
            message=prompt,
            project_id=incident.project_id,
            project_name=incident.project_name,
            repository_full_name=incident.repository_full_name,
        )
        run = await _start_agent_run(run_request, http_request, user)
        incident.agent_run_id = run.run_id
        incident.status = IncidentStatus.INVESTIGATING.value
        _append_incident_timeline(incident, "AI investigation started")
        await session.commit()
        await session.refresh(incident)
        return incident


@app.patch("/incidents/{incident_id}", response_model=IncidentResponse)
async def update_incident(
    incident_id: UUID,
    request: IncidentStatusRequest,
    user: User = Depends(require_user),
):
    async with SessionFactory() as session:
        result = await session.execute(
            select(Incident)
            .where(Incident.id == incident_id, Incident.user_id == user.id)
            .with_for_update()
        )
        incident = result.scalar_one_or_none()
        if incident is None:
            raise HTTPException(status_code=404, detail="Incident not found")
        new_status = request.status.value
        if incident.status != new_status:
            incident.status = new_status
            label = {
                IncidentStatus.OPEN: "Incident reopened",
                IncidentStatus.INVESTIGATING: "Investigation resumed",
                IncidentStatus.RESOLVED: "Incident resolved",
            }[request.status]
            _append_incident_timeline(incident, label)
            await session.commit()
            await session.refresh(incident)
        return incident

@app.post(
    "/agent/chat",
    response_model=CreateRunResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def chat(
    request: ChatRequest,
    http_request: Request,
    user: User = Depends(require_user),
):
    if not request.project_id:
        raise HTTPException(
            status_code=422,
            detail="Select a GitHub repository before starting an agent run.",
        )
    return await _start_agent_run(request, http_request, user)


async def _start_agent_run(
    run_request: ChatRequest,
    http_request: Request,
    user: User,
) -> CreateRunResponse:
    try:
        github_token = await get_github_token(user.id)
        repositories = await GithubRepoService(
            GithubClient(github_token)
        ).list_repository_summaries()
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except GithubAPIError as exc:
        raise HTTPException(
            status_code=502,
            detail="Could not load repositories from the connected GitHub account.",
        ) from exc

    selected_repository = None
    if run_request.project_id:
        selected_repository = next(
            (
                item
                for item in repositories
                if item["id"] == run_request.project_id
            ),
            None,
        )
        if selected_repository is None:
            raise HTTPException(
                status_code=404,
                detail="Selected repository is not available to your GitHub account.",
            )

    async with SessionFactory() as session:
        run = await RunEventService(session).create_run(
            user.id,
            run_request.message,
            project_id=selected_repository["id"] if selected_repository else None,
            project_name=selected_repository["name"] if selected_repository else None,
            repository_full_name=(
                selected_repository["full_name"] if selected_repository else None
            ),
        )

    run_id = run.id
    resume_gate = asyncio.Event()
    resume_gate.set()
    task_message = run_request.message
    if selected_repository:
        project_label = selected_repository["name"]
        repository_context = (
            f" GitHub repository: {selected_repository['full_name']}."
        )
        task_message = (
            f"Project context: {project_label}.{repository_context} "
            "Treat this repository as the target for repository-related work; "
            "do not ask the user to identify the repository again.\n"
            f"Task: {run_request.message}"
        )
    task = asyncio.create_task(
        run_agent(
            run_id,
            user.id,
            task_message,
            resume_gate,
            selected_repository["full_name"] if selected_repository else None,
        )
    )
    http_request.app.state.run_tasks[run_id] = task
    http_request.app.state.run_resume_gates[run_id] = resume_gate

    def clear_task(completed_task: asyncio.Task[None]) -> None:
        if http_request.app.state.run_tasks.get(run_id) is completed_task:
            http_request.app.state.run_tasks.pop(run_id, None)
            http_request.app.state.run_resume_gates.pop(run_id, None)

    task.add_done_callback(clear_task)
    return CreateRunResponse(
        run_id=run_id,
        status=RunStatus.STARTED,
        events_url=f"/agent/runs/{run_id}/events",
        run_url=f"/agent/runs/{run_id}",
    )


@app.post("/agent/runs", response_model=CreateRunResponse, status_code=202)
async def create_agent_run(
    request: ChatRequest,
    http_request: Request,
    user: User = Depends(require_user),
):
    if not request.project_id:
        raise HTTPException(
            status_code=422,
            detail="Select a GitHub repository before starting an agent run.",
        )
    return await _start_agent_run(request, http_request, user)


@app.get("/agent/runs", response_model=AgentRunListResponse)
async def list_agent_runs(
    project_id: str | None = Query(default=None, max_length=255),
    user: User = Depends(require_user),
):
    async with SessionFactory() as session:
        runs = await RunEventService(session).list_user_runs(
            user.id,
            project_id=project_id,
        )
        return AgentRunListResponse(runs=runs)


@app.get("/agent/approvals", response_model=list[AgentApprovalResponse])
async def list_agent_approvals(user: User = Depends(require_user)):
    async with SessionFactory() as session:
        result = await session.scalars(
            select(AgentApproval)
            .where(
                AgentApproval.user_id == user.id,
                or_(
                    AgentApproval.status == AgentApprovalStatus.PENDING.value,
                    AgentApproval.id.in_(
                        select(AgentApproval.id)
                        .where(AgentApproval.user_id == user.id)
                        .order_by(AgentApproval.created_at.desc())
                        .limit(100)
                    ),
                ),
            )
            .order_by(AgentApproval.created_at.desc())
        )
        return list(result)


async def _decide_agent_approval(
    approval_id: UUID,
    decision: AgentApprovalStatus,
    user: User,
) -> AgentApproval:
    async with SessionFactory() as session:
        result = await session.execute(
            select(AgentApproval)
            .where(
                AgentApproval.id == approval_id,
                AgentApproval.user_id == user.id,
            )
            .with_for_update()
        )
        approval = result.scalar_one_or_none()
        if approval is None:
            raise HTTPException(status_code=404, detail="Approval request not found")
        if approval.status != AgentApprovalStatus.PENDING.value:
            raise HTTPException(
                status_code=409,
                detail="This approval request has already been decided.",
            )
        approval.status = decision.value
        approval.decided_at = datetime.now(UTC)
        await session.commit()
        await session.refresh(approval)
        return approval


@app.post(
    "/agent/approvals/{approval_id}/approve",
    response_model=AgentApprovalResponse,
)
async def approve_agent_action(
    approval_id: UUID,
    user: User = Depends(require_user),
):
    return await _decide_agent_approval(
        approval_id,
        AgentApprovalStatus.APPROVED,
        user,
    )


@app.post(
    "/agent/approvals/{approval_id}/reject",
    response_model=AgentApprovalResponse,
)
async def reject_agent_action(
    approval_id: UUID,
    user: User = Depends(require_user),
):
    return await _decide_agent_approval(
        approval_id,
        AgentApprovalStatus.REJECTED,
        user,
    )


@app.get("/agent/runs/{run_id}", response_model=AgentRunResponse)
async def get_agent_run(
    run_id: UUID,
    user: User = Depends(require_user),
):
    async with SessionFactory() as session:
        run = await RunEventService(session).get_user_run(run_id, user.id)
        if run is None:
            raise HTTPException(status_code=404, detail="Run not found")
        return run


@app.get("/agent/runs/{run_id}/events")
async def stream_agent_run_events(
    run_id: UUID,
    request: Request,
    after_id: int = 0,
    last_event_id: str | None = Header(default=None, alias="Last-Event-ID"),
    user: User = Depends(require_user),
):
    try:
        cursor = int(last_event_id) if last_event_id is not None else after_id
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Last-Event-ID must be an integer") from exc
    if cursor < 0:
        raise HTTPException(status_code=400, detail="Event ID cannot be negative")

    async with SessionFactory() as session:
        if await RunEventService(session).get_user_run(run_id, user.id) is None:
            raise HTTPException(status_code=404, detail="Run not found")

    async def event_stream():
        nonlocal cursor
        heartbeat_at = asyncio.get_running_loop().time()
        while not await request.is_disconnected():
            async with SessionFactory() as session:
                service = RunEventService(session)
                events = await service.get_events_after(run_id, cursor, user.id)
                run = await service.get_user_run(run_id, user.id)

            for event in events:
                cursor = event.id
                payload = RunEventResponse.model_validate(event).model_dump(
                    mode="json",
                    by_alias=True,
                )
                yield (
                    f"id: {event.id}\n"
                    "event: run\n"
                    f"data: {json.dumps(payload, separators=(',', ':'))}\n\n"
                )

            if run is None or (run.status in TERMINAL_STATUSES and not events):
                return

            now = asyncio.get_running_loop().time()
            if now - heartbeat_at >= 15:
                yield ": keep-alive\n\n"
                heartbeat_at = now
            await asyncio.sleep(0.5)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@app.post("/agent/runs/{run_id}/pause", response_model=AgentRunResponse)
async def pause_agent_run(
    run_id: UUID,
    request: Request,
    user: User = Depends(require_user),
):
    gate = request.app.state.run_resume_gates.get(run_id)
    if gate is None:
        raise HTTPException(status_code=409, detail="Run is not active on this server")
    async with SessionFactory() as session:
        service = RunEventService(session)
        run = await service.get_user_run(run_id, user.id, for_update=True)
        if run is None:
            raise HTTPException(status_code=404, detail="Run not found")
        if run.status != RunStatus.RUNNING.value:
            raise HTTPException(status_code=409, detail="Only a running run can be paused")
        gate.clear()
        await service.append_event(run, RunStatus.PAUSED)
        await session.commit()
        return run


@app.post("/agent/runs/{run_id}/resume", response_model=AgentRunResponse)
async def resume_agent_run(
    run_id: UUID,
    request: Request,
    user: User = Depends(require_user),
):
    gate = request.app.state.run_resume_gates.get(run_id)
    if gate is None:
        raise HTTPException(status_code=409, detail="Run is not active on this server")
    async with SessionFactory() as session:
        service = RunEventService(session)
        run = await service.get_user_run(run_id, user.id, for_update=True)
        if run is None:
            raise HTTPException(status_code=404, detail="Run not found")
        if run.status != RunStatus.PAUSED.value:
            raise HTTPException(status_code=409, detail="Only a paused run can be resumed")
        pending_approval = await session.scalar(
            select(AgentApproval.id).where(
                AgentApproval.run_id == run_id,
                AgentApproval.user_id == user.id,
                AgentApproval.status == AgentApprovalStatus.PENDING.value,
            )
        )
        if pending_approval is not None:
            raise HTTPException(
                status_code=409,
                detail="Decide the pending approval request to continue this run.",
            )
        await service.append_event(
            run,
            RunStatus.RUNNING,
            current_run_step="Resuming run...",
        )
        await session.commit()
        gate.set()
        return run


@app.post("/agent/runs/{run_id}/cancel", response_model=AgentRunResponse)
async def cancel_agent_run(
    run_id: UUID,
    request: Request,
    user: User = Depends(require_user),
):
    async with SessionFactory() as session:
        run = await RunEventService(session).get_user_run(
            run_id,
            user.id,
            for_update=True,
        )
        if run is None:
            raise HTTPException(status_code=404, detail="Run not found")
        if run.status in TERMINAL_STATUSES:
            return run
        await session.execute(
            update(AgentApproval)
            .where(
                AgentApproval.run_id == run_id,
                AgentApproval.user_id == user.id,
                AgentApproval.status == AgentApprovalStatus.PENDING.value,
            )
            .values(
                status=AgentApprovalStatus.CANCELLED.value,
                decided_at=datetime.now(UTC),
            )
        )
        await session.commit()

    task = request.app.state.run_tasks.get(run_id)
    if task is None:
        raise HTTPException(status_code=409, detail="Run is not active on this server")
    task.cancel()
    await asyncio.gather(task, return_exceptions=True)

    async with SessionFactory() as session:
        service = RunEventService(session)
        run = await service.get_user_run(run_id, user.id)
        if run is None:
            raise HTTPException(status_code=404, detail="Run not found")
        if run.status not in TERMINAL_STATUSES:
            await service.append_event(
                run,
                RunStatus.CANCELLED,
                current_run_step="Cancelled",
            )
            await session.commit()
        return run