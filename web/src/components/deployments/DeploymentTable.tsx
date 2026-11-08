import { CheckCircle2, Clock3, ExternalLink, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  DeploymentRecord,
  DeploymentStatus,
} from "@/features/deployments/deployment.types";

const statusPresentation: Record<
  DeploymentStatus,
  { label: string; className: string; icon: typeof Clock3 }
> = {
  pending_approval: {
    label: "Needs approval",
    className: "text-amber-600 dark:text-amber-400",
    icon: Clock3,
  },
  queued: {
    label: "Queued",
    className: "text-muted-foreground",
    icon: Clock3,
  },
  in_progress: {
    label: "In progress",
    className: "text-blue-600 dark:text-blue-400",
    icon: Loader2,
  },
  successful: {
    label: "Successful",
    className: "text-emerald-600 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  failed: {
    label: "Failed",
    className: "text-red-600 dark:text-red-400",
    icon: XCircle,
  },
  cancelled: {
    label: "Cancelled",
    className: "text-muted-foreground",
    icon: XCircle,
  },
};

export function DeploymentTable({
  deployments,
  isLoading = false,
  error,
  approvingId,
  onApprove,
}: {
  deployments: DeploymentRecord[];
  isLoading?: boolean;
  error?: string | null;
  approvingId?: string | null;
  onApprove?: (deploymentId: string) => void;
}) {
  if (isLoading) {
    return (
      <p className="rounded-lg border border-border p-6 text-sm text-muted-foreground">
        Loading deployments…
      </p>
    );
  }
  if (error) {
    return (
      <p role="alert" className="rounded-lg border border-border p-6 text-sm text-destructive">
        {error}
      </p>
    );
  }
  if (deployments.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No deployments yet. Start one using a repository’s GitHub Actions workflow.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-2.5 font-medium">Project / Version</th>
            <th className="px-4 py-2.5 font-medium">Environment</th>
            <th className="px-4 py-2.5 font-medium">Status</th>
            <th className="hidden px-4 py-2.5 font-medium md:table-cell">
              Ref / Workflow
            </th>
            <th className="hidden px-4 py-2.5 font-medium lg:table-cell">
              Started
            </th>
            <th className="px-4 py-2.5 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {deployments.map((deployment) => {
            const presentation = statusPresentation[deployment.status];
            const Icon = presentation.icon;
            return (
              <tr key={deployment.id} className="align-top hover:bg-muted/30">
                <td className="px-4 py-3">
                  <p className="font-medium">{deployment.projectName}</p>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {deployment.version}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                    {deployment.repositoryFullName}
                  </p>
                </td>
                <td className="px-4 py-3 text-xs capitalize">
                  {deployment.environment}
                </td>
                <td className="px-4 py-3">
                  <span className={`flex items-center gap-1.5 text-xs ${presentation.className}`}>
                    <Icon
                      className={`h-3.5 w-3.5 ${
                        deployment.status === "in_progress" ? "animate-spin" : ""
                      }`}
                    />
                    {presentation.label}
                  </span>
                  {deployment.error && (
                    <p className="mt-1 max-w-64 text-xs text-destructive">
                      {deployment.error}
                    </p>
                  )}
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <p className="font-mono text-xs">{deployment.ref}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {deployment.workflowFile}
                  </p>
                </td>
                <td className="hidden px-4 py-3 text-xs text-muted-foreground lg:table-cell">
                  {new Date(
                    deployment.startedAt ?? deployment.createdAt,
                  ).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-start gap-1.5">
                    {deployment.status === "pending_approval" && onApprove && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={approvingId === deployment.id}
                        onClick={() => onApprove(deployment.id)}
                      >
                        {approvingId === deployment.id
                          ? "Dispatching…"
                          : "Approve & deploy"}
                      </Button>
                    )}
                    {deployment.githubRunUrl && (
                      <a
                        href={deployment.githubRunUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        GitHub Actions <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    <span className="text-[11px] text-muted-foreground">
                      by {deployment.deployedBy}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
