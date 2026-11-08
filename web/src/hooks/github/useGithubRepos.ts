import { githubRepos } from "@/api/github";
import { useQuery } from "@tanstack/react-query";

export const useGithubRepos = () => {
  return useQuery({
    queryKey: ["github-repos"],
    queryFn: githubRepos,
  });
};
