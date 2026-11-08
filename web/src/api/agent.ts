import { axiosInstance } from "@/config/axios";
import type { CreateAgentRunType } from "@/types/agent";
import type {
  AgentRunRecord,
  CreateAgentRunResponse,
} from "@/features/agent/agentrun.types";

export const createAgentRun = async (data: CreateAgentRunType) => {
  const response = await axiosInstance.post<CreateAgentRunResponse>(
    "/agent/runs",
    data,
  );
  return response.data;
};

export const getAgentRuns = async (projectId?: string) => {
  const response = await axiosInstance.get<{ runs: AgentRunRecord[] }>(
    "/agent/runs",
    { params: projectId ? { project_id: projectId } : undefined },
  );
  return response.data;
};

export const getAgentRun = async (runId: string) => {
  const response = await axiosInstance.get<AgentRunRecord>(
    `/agent/runs/${encodeURIComponent(runId)}`,
  );
  return response.data;
};

export const controlAgentRun = async (
  runId: string,
  action: "pause" | "resume" | "cancel",
) => {
  const response = await axiosInstance.post<AgentRunRecord>(
    `/agent/runs/${encodeURIComponent(runId)}/${action}`,
  );
  return response.data;
};
