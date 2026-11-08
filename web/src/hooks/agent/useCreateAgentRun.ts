import { createAgentRun } from "@/api/agent";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateAgentRun = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createAgentRun,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["agent-runs"] });
    },
  });
};
