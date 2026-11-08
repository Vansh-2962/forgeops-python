// Core domain types for ForgeOps

export type RunStatus = "running" | "completed" | "failed" | "waiting_approval";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type Severity = "low" | "medium" | "high" | "critical";

export type HealthStatus = "healthy" | "degraded" | "down" | "unknown";

export type StepStatus =
  | "done"
  | "running"
  | "pending"
  | "failed"
  | "paused"
  | "cancelled";

export interface TimelineStep {
  id: string;
  label: string;
  detail?: string;
  status: StepStatus;
  timestamp?: string;
}

export interface PlanStep {
  id: string;
  label: string;
  status: StepStatus;
}

export interface ToolCall {
  id: string;
  tool: string;
  target: string;
  status: "completed" | "running" | "failed";
  summary: string;
  detail?: string;
  output?: string;
}

export interface AgentMetrics {
  model: string;
  tokens: string;
  toolCalls: number;
  duration: string;
}

export interface AgentRun {
  id: string;
  task: string;
  project: string;
  status: RunStatus;
  currentStep: string;
  duration: string;
  startedAt: string;
  steps: TimelineStep[];
  plan: PlanStep[];
  tools: string[];
  metrics: AgentMetrics;
  terminal: string[];
  toolCalls: ToolCall[];
}

export interface Project {
  id: string;
  name: string;
  repoUrl: string;
  stack: string[];
  environment: string;
  health: HealthStatus;
  lastDeployment: string;
  metrics: {
    cpu: number;
    memory: number;
    requests: string;
    errorRate: string;
  };
  recentDeployments: Deployment[];
  recentRuns: AgentRun[];
}

export interface IncidentTimelineEntry {
  time: string;
  event: string;
}

export interface AIInvestigation {
  confidence: number;
  likelyCause: string;
  evidence: string[];
}

export interface Incident {
  id: string;
  severity: Severity;
  title: string;
  service: string;
  detectedAt: string;
  status: string;
  timeline: IncidentTimelineEntry[];
  investigation: AIInvestigation;
}

export interface Deployment {
  id: string;
  version: string;
  environment: string;
  status: "successful" | "failed" | "in_progress" | "rolled_back";
  duration: string;
  deployedBy: string;
  time: string;
  project?: string;
}

export interface ActivityItem {
  id: string;
  type: "success" | "info" | "warning" | "error";
  title: string;
  description: string;
  time: string;
}

export interface InfrastructureService {
  name: string;
  status: HealthStatus;
}
