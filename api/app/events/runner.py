import asyncio
from collections.abc import AsyncIterator
from typing import Any
from uuid import UUID

from langchain_core.messages import HumanMessage
from sqlalchemy import select

from app.agent.graph import graph
from app.events.database import SessionFactory
from app.events.models import AgentRun
from app.events.schemas import RunStatus
from app.events.service import RunEventService
from app.github.client import reset_github_context, set_github_context
from app.github.connections import get_github_token

TOOL_STEPS = {
    "get_repository_tree": "Reading repository structure...",
    "read_repository_file": "Reading repository files...",
    "search_repository_code": "Searching repository code...",
    "create_repository_file": "Creating a file...",
    "update_repository_file": "Updating a file...",
    "delete_repository_file": "Deleting a file...",
    "list_repository_branches": "Listing branches...",
    "create_repository_branch": "Creating a branch...",
    "delete_repository_branch": "Deleting a branch...",
    "list_repository_commits": "Reading commit history...",
    "create_repository_commit": "Creating a commit...",
    "get_repository_commit": "Inspecting a commit...",
    "list_repository_pull_requests": "Listing pull requests...",
    "get_repository_pull_request": "Reading pull request details...",
    "list_repository_pull_request_files": "Reading pull request changes...",
    "list_repository_pull_request_reviews": "Reading pull request reviews...",
    "create_repository_pull_request": "Creating a pull request...",
    "update_repository_pull_request": "Updating a pull request...",
    "merge_repository_pull_request": "Merging a pull request...",
    "comment_on_repository_pull_request": "Commenting on a pull request...",
    "submit_repository_pull_request_review": "Submitting a pull request review...",
}

TERMINAL_STATUSES = {
    RunStatus.COMPLETED.value,
    RunStatus.FAILED.value,
    RunStatus.CANCELLED.value,
}


def _message_text(value: Any) -> str | None:
    content = getattr(value, "content", None)
    if content is None and isinstance(value, dict):
        content = value.get("content")
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "".join(
            item.get("text", "")
            for item in content
            if isinstance(item, dict) and item.get("type") == "text"
        )
    return None


def _final_response(output: Any) -> str | None:
    text = _message_text(output)
    if text:
        return text
    if isinstance(output, dict):
        messages = output.get("messages")
        if isinstance(messages, list):
            for message in reversed(messages):
                message_type = (
                    getattr(message, "type", None)
                    if not isinstance(message, dict)
                    else message.get("type")
                )
                if message_type not in {"ai", "assistant"}:
                    continue
                text = _message_text(message)
                if text:
                    return text
        generations = output.get("generations")
        if isinstance(generations, list) and generations:
            first = generations[0]
            if isinstance(first, list) and first:
                return _message_text(first[0].get("message"))
    return None


async def _events(
    message: str,
    run_id: UUID,
    user_id: UUID,
) -> AsyncIterator[dict[str, Any]]:
    async for event in graph.astream_events(
        {"messages": [HumanMessage(content=message)]},
        version="v2",
        config={
            "configurable": {
                "run_id": str(run_id),
                "user_id": str(user_id),
            }
        },
    ):
        yield event


async def _record(
    run_id: UUID,
    status: RunStatus,
    *,
    current_run_step: str | None = None,
    response: str | None = None,
    error: str | None = None,
    details: dict[str, Any] | None = None,
) -> None:
    async with SessionFactory() as session:
        result = await session.execute(
            select(AgentRun)
            .where(AgentRun.id == run_id)
            .with_for_update()
        )
        run = result.scalar_one_or_none()
        if run is None:
            return
        if status is RunStatus.RUNNING and run.status == RunStatus.PAUSED.value:
            return
        service = RunEventService(session)
        await service.append_event(
            run,
            status,
            current_run_step=current_run_step,
            response=response,
            error=error,
            details=details,
        )
        await session.commit()


async def run_agent(
    run_id: UUID,
    user_id: UUID,
    message: str,
    resume_gate: asyncio.Event,
    repository_full_name: str | None,
) -> None:
    github_context = None
    try:
        github_token = await get_github_token(user_id)
        github_context = set_github_context(
            github_token,
            {repository_full_name} if repository_full_name else set(),
        )
        await _record(
            run_id,
            RunStatus.RUNNING,
            current_run_step="Understanding your request...",
        )
        final_response = ""
        async for event in _events(message, run_id, user_id):
            await resume_gate.wait()
            event_type = event.get("event")
            event_data = event.get("data", {})
            if event_type == "on_chat_model_start":
                await _record(
                    run_id,
                    RunStatus.RUNNING,
                    current_run_step="Thinking through the next step...",
                )
            elif event_type == "on_tool_start":
                tool_name = event.get("name", "")
                await _record(
                    run_id,
                    RunStatus.RUNNING,
                    current_run_step=TOOL_STEPS.get(
                        tool_name,
                        f"Running {tool_name.replace('_', ' ')}...",
                    ),
                    details={"tool": tool_name},
                )
            elif event_type == "on_chat_model_end":
                output = event_data.get("output")
                text = _final_response(output)
                if text:
                    final_response = text
            elif event_type == "on_chain_end":
                text = _final_response(event_data.get("output"))
                if text:
                    final_response = text

        if not final_response:
            raise RuntimeError("The agent completed without producing a response")

        await _record(
            run_id,
            RunStatus.COMPLETED,
            current_run_step="Completed",
            response=final_response,
        )
    except asyncio.CancelledError:
        await _record(
            run_id,
            RunStatus.CANCELLED,
            current_run_step="Cancelled",
        )
    except Exception as exc:
        await _record(
            run_id,
            RunStatus.FAILED,
            current_run_step="Run failed",
            error=f"{type(exc).__name__}: {exc}",
        )
    finally:
        if github_context is not None:
            reset_github_context(github_context)
