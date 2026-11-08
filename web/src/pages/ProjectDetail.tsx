import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Activity, ArrowLeft, Bot, GitBranch, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getDeployments } from "@/api/deployments";
import { DeploymentTable } from "@/components/deployments/DeploymentTable";
import { getAllProjects } from "@/api/project";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AgentRunRow } from "@/components/agent/AgentRunRow";
import { NewAgentTaskDialog } from "@/components/agent/NewAgentTaskDialog";
import { RunStatusBadge } from "@/components/shared/StatusBadge";
import { useGetAllAgentRuns } from "@/hooks/agent/useGetAllAgentRuns";
import type { AgentRunRecord } from "@/features/agent/agentrun.types";
import type { ProjectType } from "@/types/project";

export default function ProjectDetail() {
  const { projectId = "" } = useParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const {
    data: projectResponse,
    isLoading: projectsLoading,
    isError: projectsError,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: getAllProjects,
  });
  const projects = projectResponse?.data ?? [];
  const project = projects.find((item) => item.id === projectId);
  const {
    data: runResponse,
    isLoading: runsLoading,
    isError: runsError,
  } = useGetAllAgentRuns(project?.id, Boolean(project));
  const runs = runResponse?.runs ?? [];
  const {
    data: deploymentResponse,
    isLoading: deploymentsLoading,
    isError: deploymentsError,
  } = useQuery({
    queryKey: ["deployments", project?.id ?? "project"],
    queryFn: () => getDeployments(project?.id),
    enabled: Boolean(project),
    refetchInterval: (query) =>
      query.state.data?.deployments.some(
        (deployment) =>
          deployment.status === "queued" ||
          deployment.status === "in_progress",
      )
        ? 15_000
        : false,
  });

  if (projectsLoading) {
    return <p className="p-8 text-sm text-muted-foreground">Loading project…</p>;
  }
  if (projectsError) {
    return (
      <p role="alert" className="p-8 text-sm text-destructive">
        Could not load this project. Refresh and try again.
      </p>
    );
  }
  if (!project) {
    return (
      <div className="px-4 py-10 text-center text-sm text-muted-foreground">
        Project not found.{" "}
        <Link to="/projects" className="underline">
          Back to projects
        </Link>
      </div>
    );
  }

  const recentRuns = runs.slice(0, 5);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <Link
        to="/projects"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Projects
      </Link>

      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">{project.name}</h1>
          <a
            href={`https://github.com/${project.repository.fullName}`}
            target="_blank"
            rel="noreferrer"
            className="mt-1 flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground"
          >
            <GitBranch className="h-3 w-3" />
            github.com/{project.repository.fullName}
          </a>
          {project.description && (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {project.description}
            </p>
          )}
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Run agent
        </Button>
      </div>

      <Tabs defaultValue="overview" className="mt-5">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="runs">Agent Runs</TabsTrigger>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6">
          <section className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-start gap-3">
              <Activity className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <h2 className="text-sm font-medium">Project metrics</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Live CPU, memory, request, and error-rate metrics are not
                  connected for this project yet. No sample values are shown as
                  production data.
                </p>
              </div>
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Recent agent runs
              </h2>
              <button
                type="button"
                onClick={() => setDialogOpen(true)}
                className="text-xs text-primary hover:underline"
              >
                Run agent
              </button>
            </div>
            <ProjectRuns
              project={project}
              runs={recentRuns}
              isLoading={runsLoading}
              isError={runsError}
              compact
            />
          </section>
        </TabsContent>

        <TabsContent value="runs" className="mt-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Runs started from this project, with its repository context.
            </p>
            <Button
              size="sm"
              onClick={() => setDialogOpen(true)}
              className="shrink-0 gap-1.5"
            >
              <Plus className="h-4 w-4" /> Run agent
            </Button>
          </div>
          <ProjectRuns
            project={project}
            runs={runs}
            isLoading={runsLoading}
            isError={runsError}
          />
        </TabsContent>

        <TabsContent value="deployments" className="mt-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              GitHub Actions deployments for this project.
            </p>
            <Link
              to="/deployments"
              className="shrink-0 text-sm text-primary hover:underline"
            >
              Manage deployments
            </Link>
          </div>
          <DeploymentTable
            deployments={deploymentResponse?.deployments ?? []}
            isLoading={deploymentsLoading}
            error={
              deploymentsError
                ? "Could not load deployments for this project."
                : null
            }
          />
        </TabsContent>
        <TabsContent value="infrastructure" className="mt-4">
          <NotConnected title="Infrastructure monitoring" />
        </TabsContent>
        <TabsContent value="logs" className="mt-4">
          <NotConnected title="Application logs" />
        </TabsContent>
      </Tabs>

      <NewAgentTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={project}
      />
    </div>
  );
}

function ProjectRuns({
  project,
  runs,
  isLoading,
  isError,
  compact = false,
}: {
  project: ProjectType;
  runs: AgentRunRecord[];
  isLoading: boolean;
  isError: boolean;
  compact?: boolean;
}) {
  if (isLoading) {
    return (
      <p className="rounded-lg border border-border p-6 text-sm text-muted-foreground">
        Loading agent runs…
      </p>
    );
  }
  if (isError) {
    return (
      <p role="alert" className="rounded-lg border border-border p-6 text-sm text-destructive">
        Could not load agent runs for this project.
      </p>
    );
  }
  if (runs.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <Bot className="mx-auto h-5 w-5 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium">No agent runs yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Start a run to work with {project.repository.fullName}.
        </p>
      </div>
    );
  }
  if (compact) {
    return (
      <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
        {runs.map((run) => (
          <Link
            key={run.id}
            to={`/runs/${run.id}`}
            className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/40"
          >
            <span className="min-w-0 truncate text-sm">
              {run.prompt || "Agent run"}
            </span>
            <RunStatusBadge status={run.status} />
          </Link>
        ))}
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-2.5 font-medium">Task</th>
            <th className="px-4 py-2.5 font-medium">Status</th>
            <th className="hidden px-4 py-2.5 font-medium lg:table-cell">
              Current Step
            </th>
            <th className="hidden px-4 py-2.5 font-medium sm:table-cell">
              Duration
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {runs.map((run) => (
            <AgentRunRow key={run.id} run={run} projectContext />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NotConnected({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
      {title} data is not connected yet.
    </div>
  );
}
