import { getAgentRuns } from "@/api/agent";
import { useQuery } from "@tanstack/react-query";

export const useGetAllAgentRuns = (
  projectId?: string,
  enabled = true,
) => {
  return useQuery({
    queryKey: ["agent-runs", projectId ?? "all"],
    queryFn: () => getAgentRuns(projectId),
    enabled,
  });
};
