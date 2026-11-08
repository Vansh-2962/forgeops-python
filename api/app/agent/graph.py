from langgraph.graph import START, StateGraph
from langgraph.prebuilt import tools_condition

from app.agent.approval import execute_tools
from app.agent.nodes import call_model
from app.agent.state import AgentState


builder = StateGraph(AgentState)

builder.add_node(
    "agent",
    call_model,
)

builder.add_node("tools", execute_tools)

builder.add_edge(
    START,
    "agent",
)

builder.add_conditional_edges(
    "agent",
    tools_condition,
)

builder.add_edge(
    "tools",
    "agent",
)

graph = builder.compile()