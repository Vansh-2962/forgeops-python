import { axiosInstance } from "@/config/axios";
import type {
  CreateDeploymentRequest,
  DeploymentRecord,
} from "@/features/deployments/deployment.types";

export const getDeployments = async (projectId?: string) => {
  const response = await axiosInstance.get<{
    deployments: DeploymentRecord[];
  }>("/deployments", {
    params: projectId ? { project_id: projectId } : undefined,
  });
  return response.data;
};

export const createDeployment = async (
  deployment: CreateDeploymentRequest,
) => {
  const response = await axiosInstance.post<DeploymentRecord>(
    "/deployments",
    deployment,
  );
  return response.data;
};

export const approveDeployment = async (deploymentId: string) => {
  const response = await axiosInstance.post<DeploymentRecord>(
    `/deployments/${encodeURIComponent(deploymentId)}/approve`,
  );
  return response.data;
};
