import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Rocket } from "lucide-react";
import { approveDeployment, createDeployment, getDeployments } from "@/api/deployments";
import { getAllProjects } from "@/api/project";
import { DeploymentTable } from "@/components/deployments/DeploymentTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { CreateDeploymentRequest, DeploymentEnvironment } from "@/features/deployments/deployment.types";
import type { ProjectType } from "@/types/project";

export default function Deployments() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const deploymentsQuery = useQuery({
    queryKey: ["deployments", "all"],
    queryFn: () => getDeployments(),
    refetchInterval: (query) =>
      query.state.data?.deployments.some(
        (deployment) =>
          deployment.status === "queued" ||
          deployment.status === "in_progress",
      )
        ? 15_000
        : false,
  });
  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: getAllProjects,
  });
  const invalidateDeployments = () =>
    queryClient.invalidateQueries({ queryKey: ["deployments"] });
  const createMutation = useMutation({
    mutationFn: createDeployment,
    onSuccess: async () => {
      await invalidateDeployments();
      setDialogOpen(false);
    },
    onError: () => invalidateDeployments(),
  });
  const approveMutation = useMutation({
    mutationFn: approveDeployment,
    onSuccess: () => invalidateDeployments(),
    onError: () => invalidateDeployments(),
  });
  const deployments = deploymentsQuery.data?.deployments ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Deployments"
        description="Dispatch and track project deployments through GitHub Actions."
        actions={
          <Button
            size="sm"
            onClick={() => setDialogOpen(true)}
            disabled={!projectsQuery.data?.data.length}
            className="gap-1.5"
          >
            <Rocket className="h-4 w-4" /> New deployment
          </Button>
        }
      />
      {projectsQuery.isError && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          Could not load GitHub projects, so a deployment cannot be started.
        </p>
      )}
      {!projectsQuery.isLoading &&
        !projectsQuery.isError &&
        !projectsQuery.data?.data.length && (
          <p className="mt-4 text-sm text-muted-foreground">
            No GitHub repositories are available. Connect a repository before
            starting a deployment.
          </p>
        )}

      <div className="mt-5 rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex gap-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="text-sm font-medium">Required workflow contract</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Add this dispatch input and run name to{" "}
              <code className="font-mono">.github/workflows/forgeops-deploy.yml</code>.
              ForgeOps only reports a final result after it finds the run using
              this unique deployment ID.
            </p>
            <pre className="mt-2 overflow-x-auto rounded-md bg-background p-3 font-mono text-xs text-muted-foreground">
{`name: Deploy
run-name: ForgeOps deployment \${{ inputs.forgeops_deployment_id }}
on:
  workflow_dispatch:
    inputs:
      forgeops_deployment_id:
        description: ForgeOps deployment record ID
        required: true
        type: string
      version:
        required: true
        type: string
      environment:
        required: true
        type: choice
        options: [development, staging, production]`}
            </pre>
          </div>
        </div>
      </div>

      {approveMutation.isError && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          Could not approve and dispatch the deployment. Refresh and try again.
        </p>
      )}

      <div className="mt-5">
        <DeploymentTable
          deployments={deployments}
          isLoading={deploymentsQuery.isLoading}
          error={
            deploymentsQuery.isError
              ? "Could not load deployments or refresh their GitHub Actions status."
              : null
          }
          approvingId={
            approveMutation.isPending ? approveMutation.variables : null
          }
          onApprove={(deploymentId) => approveMutation.mutate(deploymentId)}
        />
      </div>

      <CreateDeploymentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projects={projectsQuery.data?.data ?? []}
        projectsLoading={projectsQuery.isLoading}
        projectsError={projectsQuery.isError}
        isPending={createMutation.isPending}
        error={
          createMutation.isError
            ? "Could not create or dispatch the deployment. Verify the workflow exists and supports workflow_dispatch."
            : null
        }
        onSubmit={(payload) => createMutation.mutate(payload)}
      />
    </div>
  );
}

function CreateDeploymentDialog({
  open,
  onOpenChange,
  projects,
  projectsLoading,
  projectsError,
  isPending,
  error,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: ProjectType[];
  projectsLoading: boolean;
  projectsError: boolean;
  isPending: boolean;
  error: string | null;
  onSubmit: (payload: CreateDeploymentRequest) => void;
}) {
  const [projectId, setProjectId] = useState("");
  const [workflowFile, setWorkflowFile] = useState("forgeops-deploy.yml");
  const [ref, setRef] = useState("");
  const [version, setVersion] = useState("");
  const [environment, setEnvironment] =
    useState<DeploymentEnvironment>("staging");
  const project = projects.find((item) => item.id === projectId);

  useEffect(() => {
    if (!projectId && projects.length > 0) {
      setProjectId(projects[0].id);
      setRef(projects[0].repository.defaultBranch);
    }
  }, [projectId, projects]);

  const reset = () => {
    setProjectId("");
    setWorkflowFile("forgeops-deploy.yml");
    setRef("");
    setVersion("");
    setEnvironment("staging");
  };
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !isPending) reset();
    onOpenChange(nextOpen);
  };
  const handleProjectChange = (nextProjectId: string) => {
    const nextProject = projects.find((item) => item.id === nextProjectId);
    setProjectId(nextProjectId);
    setRef(nextProject?.repository.defaultBranch ?? "");
  };
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!project) return;
    onSubmit({
      projectId: project.id,
      workflowFile: workflowFile.trim(),
      ref: ref.trim(),
      version: version.trim(),
      environment,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Start a deployment</DialogTitle>
          <DialogDescription>
            Dispatches the project’s GitHub Actions workflow. Production
            deployments are held for approval before dispatch.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Project</span>
            <select
              required
              value={projectId}
              onChange={(event) => handleProjectChange(event.target.value)}
              disabled={projectsLoading || projects.length === 0}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">
                {projectsLoading ? "Loading projects…" : "Select a project"}
              </option>
              {projects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — {item.repository.fullName}
                </option>
              ))}
            </select>
            {projectsError && (
              <span className="block text-xs text-destructive">
                Could not load projects. Refresh and try again.
              </span>
            )}
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Version / release label</span>
              <Input
                required
                maxLength={160}
                value={version}
                onChange={(event) => setVersion(event.target.value)}
                placeholder="v1.2.3"
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Target environment</span>
              <select
                value={environment}
                onChange={(event) =>
                  setEnvironment(event.target.value as DeploymentEnvironment)
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="development">Development</option>
                <option value="staging">Staging</option>
                <option value="production">Production (approval required)</option>
              </select>
            </label>
          </div>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Branch, tag, or ref</span>
            <Input
              required
              maxLength={255}
              value={ref}
              onChange={(event) => setRef(event.target.value)}
              placeholder={project?.repository.defaultBranch ?? "main"}
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Workflow file</span>
            <Input
              required
              maxLength={120}
              pattern="[^/\\]+\.ya?ml"
              title="Use a workflow filename such as forgeops-deploy.yml"
              value={workflowFile}
              onChange={(event) => setWorkflowFile(event.target.value)}
              placeholder="forgeops-deploy.yml"
            />
            <span className="block text-xs text-muted-foreground">
              Must be a .yml or .yaml workflow under .github/workflows.
            </span>
          </label>
          {environment === "production" && (
            <p className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-300">
              This deployment will not be sent to GitHub until you approve it
              from the deployment list.
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isPending ||
                !project ||
                !workflowFile.trim() ||
                !ref.trim() ||
                !version.trim()
              }
            >
              {isPending
                ? "Starting…"
                : environment === "production"
                  ? "Create approval request"
                  : "Dispatch workflow"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
