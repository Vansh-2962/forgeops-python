from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage
from app.config import settings
from app.agent.state import AgentState
from app.agent.tools import tools
from app.agent.prompts import SYSTEM_PROMPT


llm = ChatGroq(
    model=settings.groq_model,
    api_key=settings.groq_api_key,
    temperature=0,
)

llm_with_tools = llm.bind_tools(tools)


async def call_model(state: AgentState):
    messages = [ SystemMessage(content=SYSTEM_PROMPT), *state["messages"], ]

    response = await llm_with_tools.ainvoke(messages)

    return {
        "messages": [response]
    }