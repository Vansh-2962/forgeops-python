export type DeploymentEnvironment = "development" | "staging" | "production";
export type DeploymentStatus =
  | "pending_approval"
  | "queued"
  | "in_progress"
  | "successful"
  | "failed"
  | "cancelled";

export interface DeploymentRecord {
  id: string;
  projectId: string;
  projectName: string;
  repositoryFullName: string;
  deployedBy: string;
  workflowFile: string;
  ref: string;
  version: string;
  environment: DeploymentEnvironment;
  status: DeploymentStatus;
  githubRunId: number | null;
  githubRunUrl: string | null;
  error: string | null;
  approvedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface CreateDeploymentRequest {
  projectId: string;
  workflowFile: string;
  ref: string;
  version: string;
  environment: DeploymentEnvironment;
}
