import { axiosInstance } from "@/config/axios";
import type { AgentApproval } from "@/features/agent/approval.types";

export const getAgentApprovals = async () => {
  const response = await axiosInstance.get<AgentApproval[]>("/agent/approvals");
  return response.data;
};

export const decideAgentApproval = async (
  approvalId: string,
  decision: "approve" | "reject",
) => {
  const response = await axiosInstance.post<AgentApproval>(
    `/agent/approvals/${encodeURIComponent(approvalId)}/${decision}`,
  );
  return response.data;
};
