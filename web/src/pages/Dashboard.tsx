import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bot,
  CircleAlert,
  Rocket,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getAgentRuns } from "@/api/agent";
import { getAgentApprovals } from "@/api/approvals";
import { getDeployments } from "@/api/deployments";
import { getIncidents } from "@/api/incidents";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { RunStatusBadge, StatusDot } from "@/components/shared/StatusBadge";
import type { AgentRunRecord } from "@/features/agent/agentrun.types";
import type { ActivityItem } from "@/types";
import { formatRelativeDate } from "@/utils/formatDate";
import { useSession } from "@/lib/auth-client";

const isActiveRun = (run: AgentRunRecord) =>
  run.status === "STARTED" || run.status === "RUNNING";

const recentRunActivity = (run: AgentRunRecord): ActivityItem => {
  const activityType: ActivityItem["type"] =
    run.status === "FAILED"
      ? "error"
      : run.status === "COMPLETED"
        ? "success"
        : run.status === "PAUSED"
          ? "warning"
          : "info";
  const activityTitle: Record<AgentRunRecord["status"], string> = {
    STARTED: "Agent run started",
    RUNNING: "Agent run in progress",
    FAILED: "Agent run failed",
    COMPLETED: "Agent run completed",
    PAUSED: "Agent run paused",
    CANCELLED: "Agent run cancelled",
  };
  const project = run.projectName ?? run.repositoryFullName ?? "Unassigned project";

  return {
    id: `run-${run.id}`,
    type: activityType,
    title: activityTitle[run.status],
    description: `${project}${run.prompt ? ` · ${run.prompt}` : ""}`,
    time: formatRelativeDate(
      run.completedAt ?? run.startedAt ?? run.createdAt,
    ),
  };
};

export default function Dashboard() {
  const runsQuery = useQuery({
    queryKey: ["agent-runs", "all"],
    queryFn: () => getAgentRuns(),
    refetchInterval: 10_000,
  });
  const deploymentsQuery = useQuery({
    queryKey: ["deployments", "all"],
    queryFn: () => getDeployments(),
    refetchInterval: 30_000,
  });
  const incidentsQuery = useQuery({
    queryKey: ["incidents"],
    queryFn: getIncidents,
    refetchInterval: 30_000,
  });
  const approvalsQuery = useQuery({
    queryKey: ["agent-approvals"],
    queryFn: getAgentApprovals,
    refetchInterval: 30_000,
  });

  const { data: session } = useSession();
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const runs = runsQuery.data?.runs ?? [];
  const deployments = deploymentsQuery.data?.deployments ?? [];
  const incidents = incidentsQuery.data?.incidents ?? [];
  const approvals = approvalsQuery.data ?? [];
  const activeRuns = runs.filter(isActiveRun);
  const displayedRuns =
    activeRuns.length > 0
      ? activeRuns
      : [...runs]
          .sort(
            (left, right) =>
              new Date(right.createdAt).getTime() -
              new Date(left.createdAt).getTime(),
          )
          .slice(0, 2);
  const now = new Date();
  const deploymentsToday = deployments.filter((deployment) => {
    const createdAt = new Date(deployment.createdAt);
    return (
      !Number.isNaN(createdAt.getTime()) &&
      createdAt.toDateString() === now.toDateString()
    );
  }).length;
  const openIncidents = incidents.filter(
    (incident) => incident.status !== "resolved",
  ).length;
  const pendingApprovals = approvals.filter(
    (approval) => approval.status === "pending",
  ).length;

  const activity: Array<{ timestamp: number; item: ActivityItem }> = [
    ...runs.map((run) => ({
      timestamp: Date.parse(
        run.completedAt ?? run.startedAt ?? run.createdAt,
      ),
      item: recentRunActivity(run),
    })),
    ...deployments.map((deployment) => {
      const labels = {
        pending_approval: ["Deployment awaiting approval", "warning"],
        queued: ["Deployment queued", "info"],
        in_progress: ["Deployment in progress", "info"],
        successful: ["Deployment succeeded", "success"],
        failed: ["Deployment failed", "error"],
        cancelled: ["Deployment cancelled", "warning"],
      } as const;
      const [title, type] = labels[deployment.status];

      return {
        timestamp: Date.parse(
          deployment.completedAt ??
            deployment.startedAt ??
            deployment.createdAt,
        ),
        item: {
          id: `deployment-${deployment.id}`,
          type,
          title,
          description: `${deployment.projectName} · ${deployment.environment}`,
          time: formatRelativeDate(
            deployment.completedAt ??
              deployment.startedAt ??
              deployment.createdAt,
          ),
        } satisfies ActivityItem,
      };
    }),
    ...incidents.map((incident) => ({
      timestamp: Date.parse(incident.updatedAt ?? incident.createdAt),
      item: {
        id: `incident-${incident.id}`,
        type:
          incident.status === "resolved"
            ? "success"
            : incident.severity === "high" ||
                incident.severity === "critical"
              ? "error"
              : "warning",
        title:
          incident.status === "resolved"
            ? `Incident resolved: ${incident.title}`
            : `Incident ${incident.status}: ${incident.title}`,
        description: `${incident.service} · ${incident.severity} severity`,
        time: formatRelativeDate(incident.updatedAt ?? incident.createdAt),
      } satisfies ActivityItem,
    })),
  ]
    .sort((left, right) => {
      const leftDate = Number.isFinite(left.timestamp) ? left.timestamp : 0;
      const rightDate = Number.isFinite(right.timestamp) ? right.timestamp : 0;
      return rightDate - leftDate;
    })
    .slice(0, 8);
  const recentActivity = activity.map(({ item }) => item);

  const loadingRuns = runsQuery.isLoading;
  const loadingDeployments = deploymentsQuery.isLoading;
  const loadingIncidents = incidentsQuery.isLoading;
  const loadingApprovals = approvalsQuery.isLoading;
  const dashboardErrors = [
    runsQuery.isError && "agent runs",
    deploymentsQuery.isError && "deployments",
    incidentsQuery.isError && "incidents",
    approvalsQuery.isError && "approvals",
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title={`${greeting}, ${session?.user?.name || "User"}`}
        description="A live overview of your agent runs, deployments, incidents, and approvals."
      />

      {dashboardErrors.length > 0 && (
        <p role="alert" className="mt-4 flex items-center gap-2 text-sm text-destructive">
          <CircleAlert className="h-4 w-4 shrink-0" />
          Could not load {dashboardErrors.join(", ")}. Some dashboard totals or
          recent activity may be incomplete.
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Active Agent Runs"
          value={loadingRuns || runsQuery.isError ? "—" : activeRuns.length}
          icon={Bot}
        />
        <MetricCard
          label="Deployments Today"
          value={
            loadingDeployments || deploymentsQuery.isError
              ? "—"
              : deploymentsToday
          }
          icon={Rocket}
        />
        <MetricCard
          label="Open Incidents"
          value={
            loadingIncidents || incidentsQuery.isError ? "—" : openIncidents
          }
          icon={AlertTriangle}
          tone={
            incidentsQuery.isError
              ? "default"
              : openIncidents > 0
                ? "warning"
                : "success"
          }
        />
        <Link
          to="/approvals"
          className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MetricCard
            label="Pending Approvals"
            value={
              loadingApprovals || approvalsQuery.isError
                ? "—"
                : pendingApprovals
            }
            icon={ShieldCheck}
            tone="warning"
          />
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {activeRuns.length > 0 ? "Active Agent Runs" : "Recent Agent Runs"}
            </h2>
            <Link
              to="/runs"
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {loadingRuns ? (
              <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
                Loading agent runs…
              </p>
            ) : runsQuery.isError ? (
              <p role="alert" className="rounded-lg border border-border bg-card p-4 text-sm text-destructive">
                Could not load agent runs.
              </p>
            ) : displayedRuns.length > 0 ? (
              displayedRuns.map((run) => (
                <Link
                  key={run.id}
                  to={`/runs/${run.id}`}
                  className="block rounded-lg border border-border bg-card p-4 transition-colors hover:border-foreground/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {run.prompt || "Agent task"}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                        {run.repositoryFullName ??
                          run.projectName ??
                          "Unassigned project"}
                      </p>
                    </div>
                    <RunStatusBadge status={run.status} />
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <StatusDot
                      status={run.status}
                      pulse={isActiveRun(run)}
                    />
                    <span className="truncate">
                      {run.currentRunStep || run.status.toLowerCase()}
                    </span>
                    <span className="text-border">·</span>
                    <span className="shrink-0">
                      {formatRelativeDate(run.createdAt)}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
                No agent runs yet. Start a task to see it here.
              </p>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Recent Activity
          </h2>
          <div className="rounded-lg border border-border bg-card p-4">
            {runsQuery.isLoading &&
            deploymentsQuery.isLoading &&
            incidentsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">
                Loading recent activity…
              </p>
            ) : recentActivity.length > 0 ? (
              <ActivityFeed items={recentActivity} />
            ) : (
              <p className="text-sm text-muted-foreground">
                No recent activity to show.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
