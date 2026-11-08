import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { suggestedTasks } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { useCreateAgentRun } from "@/hooks/agent/useCreateAgentRun";
import { beginGithubConnection } from "@/api/github";
import type { ProjectType } from "@/types/project";
import { getAllProjects } from "@/api/project";
import { useGithubStatus } from "@/hooks/github/useGithubStatus";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function NewAgentTaskDialog({
  open,
  onOpenChange,
  project,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: ProjectType;
}) {
  const [task, setTask] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { mutateAsync, isPending } = useCreateAgentRun();
  const githubStatus = useGithubStatus();
  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: getAllProjects,
    enabled: Boolean(githubStatus.data?.connected) && !project,
  });
  const projects = projectsQuery.data?.data ?? [];
  const selectedProject =
    project ?? projects.find((item) => item.id === selectedProjectId);

  const handleStart = async () => {
    const message = task.trim();
    if (!message || !selectedProject) return;
    setError("");
    try {
      const run = await mutateAsync({
        message,
        projectId: selectedProject.id,
        projectName: selectedProject.name,
        repositoryFullName: selectedProject.repository.fullName,
      });
      setTask("");
      onOpenChange(false);
      navigate(`/runs/${run.runId}`);
    } catch {
      setError("Could not start the agent run. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {project ? `Run agent on ${project.name}` : "Create Agent Task"}
          </DialogTitle>
          <DialogDescription>
            {project
              ? `Describe what you want ForgeOps to do in ${project.repository.fullName}.`
              : "Choose one of your connected GitHub repositories, then describe the task for ForgeOps."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!githubStatus.data?.connected ? (
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
              <p className="font-medium">Connect GitHub to start an agent run</p>
              {githubStatus.isError && (
                <p role="alert" className="mt-1 text-xs text-destructive">
                  Could not check your GitHub connection. Refresh and try
                  again.
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                ForgeOps needs access to the repository you choose. Your GitHub
                account stays separate from other users.
              </p>
              <Button
                className="mt-3"
                size="sm"
                disabled={
                  githubStatus.isLoading ||
                  githubStatus.isError ||
                  !githubStatus.data?.configured
                }
                onClick={() => beginGithubConnection(window.location.pathname)}
              >
                Connect GitHub
              </Button>
              {githubStatus.data && !githubStatus.data.configured && (
                <p role="alert" className="mt-2 text-xs text-destructive">
                  GitHub OAuth is not configured on this server.
                </p>
              )}
            </div>
          ) : !project ? (
            <div className="space-y-2">
              <label className="text-xs font-medium" htmlFor="agent-project">
                Repository
              </label>
              <Select
                value={selectedProjectId}
                onValueChange={setSelectedProjectId}
                disabled={projectsQuery.isLoading || projects.length === 0}
              >
                <SelectTrigger id="agent-project">
                  <SelectValue
                    placeholder={
                      projectsQuery.isLoading
                        ? "Loading repositories…"
                        : "Select a repository"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.repository.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {projectsQuery.isError && (
                <p role="alert" className="text-xs text-destructive">
                  Could not load your repositories. Refresh and try again.
                </p>
              )}
              {!projectsQuery.isLoading &&
                !projectsQuery.isError &&
                projects.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No repositories are available to this GitHub account.
                  </p>
                )}
            </div>
          ) : null}
          <Textarea
            value={task}
            onChange={(event) => setTask(event.target.value)}
            placeholder="For example: Inspect owner/repository and summarize its structure."
            className="min-h-32 resize-none font-mono text-sm"
            maxLength={12000}
          />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div>
            <p className="mb-2 text-xs text-muted-foreground">
              Suggested tasks
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestedTasks.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setTask(`${suggestion} — `)}
                  className={cn(
                    "rounded-md border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground",
                    task.startsWith(suggestion) &&
                      "border-foreground/30 text-foreground",
                  )}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleStart()}
            className="gap-1.5 px-5"
            disabled={
              !task.trim() ||
              !selectedProject ||
              isPending ||
              !githubStatus.data?.connected
            }
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Starting
              </>
            ) : (
              <>
                Start Agent <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
