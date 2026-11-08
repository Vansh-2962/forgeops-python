export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type IncidentStatus = "open" | "investigating" | "resolved";

export interface IncidentTimelineEntry {
  time: string;
  event: string;
}

export interface IncidentRecord {
  id: string;
  projectId: string | null;
  projectName: string | null;
  repositoryFullName: string | null;
  title: string;
  service: string;
  description: string | null;
  severity: IncidentSeverity;
  status: IncidentStatus;
  timeline: IncidentTimelineEntry[];
  agentRunId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeclareIncidentRequest {
  title: string;
  service: string;
  severity: IncidentSeverity;
  description?: string;
  projectId?: string;
  projectName?: string;
  repositoryFullName?: string;
}
