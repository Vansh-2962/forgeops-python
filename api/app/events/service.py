from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.events.models import AgentRun, RunEvent
from app.events.schemas import RunStatus


class RunEventService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_run(
        self,
        user_id: UUID,
        prompt: str,
        project_id: str | None = None,
        project_name: str | None = None,
        repository_full_name: str | None = None,
    ) -> AgentRun:
        now = datetime.now(UTC)
        run = AgentRun(
            id=uuid4(),
            user_id=user_id,
            project_id=project_id,
            project_name=project_name,
            repository_full_name=repository_full_name,
            prompt=prompt,
            status=RunStatus.STARTED.value,
            current_run_step="Starting run...",
            started_at=now,
        )
        self.session.add(run)
        await self.session.flush()
        await self.append_event(
            run,
            RunStatus.STARTED,
            current_run_step="Starting run...",
            timestamp=now,
        )
        await self.session.commit()
        return run

    async def append_event(
        self,
        run: AgentRun,
        status: RunStatus,
        *,
        current_run_step: str | None = None,
        response: str | None = None,
        error: str | None = None,
        details: dict[str, Any] | None = None,
        timestamp: datetime | None = None,
    ) -> RunEvent:
        now = timestamp or datetime.now(UTC)
        if status is RunStatus.RUNNING and run.started_at is None:
            run.started_at = now
        if status in {
            RunStatus.COMPLETED,
            RunStatus.FAILED,
            RunStatus.CANCELLED,
        }:
            run.completed_at = now
        run.status = status.value
        if current_run_step is not None:
            run.current_run_step = current_run_step
        if response is not None:
            run.response = response
        if error is not None:
            run.error = error

        event = RunEvent(
            run_id=run.id,
            timestamp=now,
            status=status.value,
            current_run_step=run.current_run_step,
            response=response,
            error=error,
            started_at=run.started_at,
            completed_at=run.completed_at,
            details=details,
        )
        self.session.add(event)
        await self.session.flush()
        return event

    async def get_run(
        self,
        run_id: UUID,
        *,
        for_update: bool = False,
    ) -> AgentRun | None:
        if not for_update:
            return await self.session.get(AgentRun, run_id)
        result = await self.session.execute(
            select(AgentRun)
            .where(AgentRun.id == run_id)
            .with_for_update()
        )
        return result.scalar_one_or_none()

    async def get_user_run(
        self,
        run_id: UUID,
        user_id: UUID,
        *,
        for_update: bool = False,
    ) -> AgentRun | None:
        query = select(AgentRun).where(
            AgentRun.id == run_id,
            AgentRun.user_id == user_id,
        )
        if for_update:
            query = query.with_for_update()
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def list_user_runs(
        self,
        user_id: UUID,
        limit: int = 100,
        project_id: str | None = None,
    ) -> list[AgentRun]:
        query = select(AgentRun).where(AgentRun.user_id == user_id)
        if project_id is not None:
            query = query.where(AgentRun.project_id == project_id)
        result = await self.session.scalars(
            query.order_by(AgentRun.created_at.desc()).limit(limit)
        )
        return list(result)

    async def get_events_after(
        self,
        run_id: UUID,
        after_event_id: int,
        user_id: UUID,
    ) -> list[RunEvent]:
        result = await self.session.scalars(
            select(RunEvent)
            .join(AgentRun, AgentRun.id == RunEvent.run_id)
            .where(
                RunEvent.run_id == run_id,
                RunEvent.id > after_event_id,
                AgentRun.user_id == user_id,
            )
            .order_by(RunEvent.id)
        )
        return list(result)
