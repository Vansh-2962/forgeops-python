import { axiosInstance } from "@/config/axios";
import { env } from "@/config/env";

export interface GithubConnectionStatus {
  configured: boolean;
  connected: boolean;
  login: string | null;
  connectedAt: string | null;
}

export const githubConnectionStatus = async () => {
  const res = await axiosInstance.get<GithubConnectionStatus>("/github/status");
  return res.data;
};

export const githubRepos = async () => {
  const res = await axiosInstance.get("/github/repos");
  return res.data;
};

export const beginGithubConnection = (returnTo = "/settings#repositories") => {
  const url = new URL(`${env.VITE_API_BASE_URL}/github/connect`, window.location.origin);
  url.searchParams.set("return_to", returnTo);
  window.location.assign(url.toString());
};

export const disconnectGithub = async () => {
  await axiosInstance.delete("/github/connection");
};
