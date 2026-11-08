import { axiosInstance } from "@/config/axios";
import type { ProjectType } from "@/types/project";

export const getAllProjects = async () => {
  const response = await axiosInstance.get<{
    data: ProjectType[];
    count: number;
  }>("/project");
  return response.data;
};
