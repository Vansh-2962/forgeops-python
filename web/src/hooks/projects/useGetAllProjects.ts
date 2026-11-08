import { useQuery } from "@tanstack/react-query";
import { getAllProjects } from "@/api/project";

export const useGetAllProjects = () => {
  return useQuery({
    queryKey: ["projects"],
    queryFn: getAllProjects,
  });
};
