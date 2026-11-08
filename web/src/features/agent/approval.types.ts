import type { RiskLevel } from "@/types";

export type AgentApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";

export interface AgentApproval {
  id: string;
  runId: string;
  toolName: string;
  arguments: Record<string, unknown>;
  risk: RiskLevel;
  status: AgentApprovalStatus;
  createdAt: string;
  decidedAt: string | null;
}
