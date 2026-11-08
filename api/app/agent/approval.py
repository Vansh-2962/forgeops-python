import asyncio
from typing import Any
from uuid import UUID, uuid4

from langchain_core.messages import AIMessage, ToolMessage
from langchain_core.runnables import RunnableConfig
from langgraph.prebuilt import ToolNode
from sqlalchemy import select

from app.agent.state import AgentState
from app.agent.tools import APPROVAL_REQUIRED_TOOLS, TOOL_RISKS, tools
from app.events.database import SessionFactory
from app.events.models import AgentApproval, AgentRun
from app.events.schemas import AgentApprovalStatus, RunStatus
from app.events.service import RunEventService

_tools_by_name = {tool.name: tool for tool in tools}


async def _record_run_status(
    run_id: UUID,
    status: RunStatus,
    *,
    current_run_step: str,
    details: dict[str, Any],
) -> None:
    async with SessionFactory() as session:
        result = await session.execute(
            select(AgentRun).where(AgentRun.id == run_id).with_for_update()
        )
        run = result.scalar_one_or_none()
        if run is None:
            raise RuntimeError(f"Agent run {run_id} no longer exists")
        if run.status in {
            RunStatus.COMPLETED.value,
            RunStatus.FAILED.value,
            RunStatus.CANCELLED.value,
        }:
            raise RuntimeError(f"Agent run {run_id} is no longer active")
        await RunEventService(session).append_event(
            run,
            status,
            current_run_step=current_run_step,
            details=details,
        )
        await session.commit()


async def _create_approval(
    run_id: UUID,
    user_id: UUID,
    tool_name: str,
    arguments: dict[str, Any],
) -> AgentApproval:
    async with SessionFactory() as session:
        approval = AgentApproval(
            id=uuid4(),
            user_id=user_id,
            run_id=run_id,
            tool_name=tool_name,
            arguments=arguments,
            risk=TOOL_RISKS[tool_name],
            status=AgentApprovalStatus.PENDING.value,
        )
        session.add(approval)
        await session.commit()
        await session.refresh(approval)
        return approval


async def _wait_for_decision(approval_id: UUID) -> AgentApprovalStatus:
    while True:
        async with SessionFactory() as session:
            approval = await session.get(AgentApproval, approval_id)
            if approval is None:
                raise RuntimeError(f"Approval request {approval_id} no longer exists")
            decision = AgentApprovalStatus(approval.status)
            if decision is not AgentApprovalStatus.PENDING:
                return decision
        await asyncio.sleep(0.5)


async def execute_tools(
    state: AgentState,
    config: RunnableConfig,
) -> dict[str, list[ToolMessage]]:
    messages = state["messages"]
    if not messages:
        raise RuntimeError("Cannot execute tools without an agent message")
    last_message = messages[-1]
    tool_calls = getattr(last_message, "tool_calls", None)
    if not tool_calls:
        raise RuntimeError("The agent requested tool execution without any tool calls")

    configurable = config.get("configurable", {})
    try:
        run_id = UUID(str(configurable["run_id"]))
        user_id = UUID(str(configurable["user_id"]))
    except (KeyError, ValueError) as exc:
        raise RuntimeError("Agent tool execution requires run and user context") from exc

    tool_messages: list[ToolMessage] = []
    for tool_call in tool_calls:
        tool_name = tool_call["name"]
        tool = _tools_by_name.get(tool_name)
        if tool is None:
            raise RuntimeError(f"Agent requested unknown tool {tool_name!r}")

        if tool_name in APPROVAL_REQUIRED_TOOLS:
            arguments = tool_call["args"]
            approval = await _create_approval(
                run_id,
                user_id,
                tool_name,
                arguments,
            )
            await _record_run_status(
                run_id,
                RunStatus.PAUSED,
                current_run_step="Waiting for human approval...",
                details={
                    "approvalId": str(approval.id),
                    "tool": tool_name,
                    "risk": approval.risk,
                },
            )
            decision = await _wait_for_decision(approval.id)
            if decision is not AgentApprovalStatus.APPROVED:
                await _record_run_status(
                    run_id,
                    RunStatus.RUNNING,
                    current_run_step="Continuing after the approval decision...",
                    details={
                        "approvalId": str(approval.id),
                        "tool": tool_name,
                        "decision": decision.value,
                    },
                )
                tool_messages.append(
                    ToolMessage(
                        content=(
                            "The user rejected this action. Do not retry it or "
                            "perform an equivalent mutation; explain the rejection "
                            "and ask whether the user wants a different action."
                        ),
                        tool_call_id=tool_call["id"],
                        name=tool_name,
                    )
                )
                continue

            await _record_run_status(
                run_id,
                RunStatus.RUNNING,
                current_run_step="Approval granted. Executing the requested action...",
                details={
                    "approvalId": str(approval.id),
                    "tool": tool_name,
                    "decision": decision.value,
                },
            )

        result = await ToolNode([tool]).ainvoke(
            {
                "messages": [
                    AIMessage(content="", tool_calls=[tool_call]),
                ]
            },
            config=config,
        )
        tool_messages.extend(result["messages"])

    return {"messages": tool_messages}
