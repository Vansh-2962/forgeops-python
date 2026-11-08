import { githubConnectionStatus } from "@/api/github";
import { useQuery } from "@tanstack/react-query";

export const useGithubStatus = () => {
  return useQuery({
    queryKey: ["github-connection-status"],
    queryFn: githubConnectionStatus,
  });
};
