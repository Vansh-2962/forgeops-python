export type AgentStatus =
  | "STARTED"
  | "RUNNING"
  | "FAILED"
  | "COMPLETED"
  | "PAUSED"
  | "CANCELLED";

export interface AgentRunEvent {
  id: number;
  runId: string;
  timestamp: string;
  status: AgentStatus;
  currentRunStep: string | null;
  response: string | null;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
  details: Record<string, unknown> | null;
}

export interface AgentRunRecord {
  id: string;
  projectId: string | null;
  projectName: string | null;
  repositoryFullName?: string | null;
  prompt: string | null;
  status: AgentStatus;
  currentRunStep: string | null;
  response: string | null;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface CreateAgentRunResponse {
  runId: string;
  status: AgentStatus;
  eventsUrl: string;
  runUrl: string;
}
