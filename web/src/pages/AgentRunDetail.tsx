import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Clock, Pause, Play, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { controlAgentRun, getAgentRun } from "@/api/agent";
import { Button } from "@/components/ui/button";
import { RunStatusBadge, StatusDot } from "@/components/shared/StatusBadge";
import { AgentTimeline } from "@/components/agent/AgentTimeline";
import { useAgentRunEvents } from "@/features/agent/use-agent-run-events";
import { formatDuration } from "@/features/agent/helpers/formatDuration";
import type { TimelineStep } from "@/types";

const terminalStatuses = ["COMPLETED", "FAILED", "CANCELLED"];

export default function AgentRunDetail() {
  const { runId = "" } = useParams();
  const queryClient = useQueryClient();
  const {
    data: run,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["agent-run", runId],
    queryFn: () => getAgentRun(runId),
    enabled: Boolean(runId),
  });
  const live = useAgentRunEvents({
    agentRunId: runId,
    initialStatus: run?.status ?? "STARTED",
    initialStartedAt: run?.startedAt,
    initialCompletedAt: run?.completedAt,
    initialCurrentStep: run?.currentRunStep,
    enabled: Boolean(run),
  });
  const control = useMutation({
    mutationFn: (action: "pause" | "resume" | "cancel") =>
      controlAgentRun(runId, action),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["agent-run", runId] });
      void queryClient.invalidateQueries({ queryKey: ["agent-runs"] });
    },
  });

  useEffect(() => {
    if (terminalStatuses.includes(live.status)) {
      void queryClient.invalidateQueries({ queryKey: ["agent-run", runId] });
      void queryClient.invalidateQueries({ queryKey: ["agent-runs"] });
    }
  }, [live.status, queryClient, runId]);

  if (isLoading) {
    return <p className="p-8 text-sm text-muted-foreground">Loading run…</p>;
  }
  if (isError || !run) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 text-center text-sm text-muted-foreground">
        Run not found or access denied.{" "}
        <Link to="/runs" className="underline">
          Back to runs
        </Link>
      </div>
    );
  }

  const currentStatus = live.status || run.status;
  const currentStep = live.currentStep || run.currentRunStep || "Starting run...";
  const currentResponse = live.response ?? run.response;
  const currentError = live.error ?? run.error;
  const startedAt = live.startedAt ?? run.startedAt;
  const completedAt = live.completedAt ?? run.completedAt;
  const isTerminal = terminalStatuses.includes(currentStatus);
  const isWaitingForApproval =
    currentStatus === "PAUSED" &&
    currentStep === "Waiting for human approval...";
  const progressEvents = live.events.filter(
    (event, index) =>
      index === 0 ||
      event.currentRunStep !== live.events[index - 1].currentRunStep,
  );
  const activeStepStatus: TimelineStep["status"] =
    currentStatus === "COMPLETED"
      ? "done"
      : currentStatus === "FAILED"
        ? "failed"
        : currentStatus === "CANCELLED"
          ? "cancelled"
          : currentStatus === "PAUSED"
            ? "paused"
            : currentStatus === "RUNNING"
              ? "running"
              : "pending";
  const progressSteps: TimelineStep[] = progressEvents.length
    ? progressEvents.map((event, index) => ({
        id: String(event.id),
        label: event.currentRunStep || event.status,
        status:
          index < progressEvents.length - 1 ? "done" : activeStepStatus,
        timestamp: new Date(event.timestamp).toLocaleTimeString(),
      }))
    : [
        {
          id: "current",
          label: currentStep,
          status: activeStepStatus,
        },
      ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Link to="/runs" className="hover:text-foreground">
          Agent Runs
        </Link>
        <span>/</span>
        <span className="font-mono">{run.id}</span>
      </div>

      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-xl font-semibold tracking-tight">
            {run.prompt || "Agent run"}
          </h1>
          {run.projectId && (
            <Link
              to={`/projects/${encodeURIComponent(run.projectId)}`}
              className="mt-1 inline-block text-xs text-muted-foreground hover:text-foreground"
            >
              Project: {run.projectName || "View project"}
            </Link>
          )}
          <div className="mt-2 flex items-center gap-2">
            <RunStatusBadge status={currentStatus} />
            {startedAt && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatDuration(live.duration)}
              </span>
            )}
          </div>
        </div>
        {!isTerminal && (
          <div className="flex gap-2">
            {isWaitingForApproval ? (
              <Button variant="outline" size="sm" asChild>
                <Link to="/approvals">Review approval</Link>
              </Button>
            ) : currentStatus === "PAUSED" ? (
              <Button
                variant="outline"
                size="sm"
                disabled={control.isPending}
                onClick={() => control.mutate("resume")}
              >
                <Play className="mr-1.5 h-3.5 w-3.5" /> Resume
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                disabled={control.isPending || currentStatus === "STARTED"}
                onClick={() => control.mutate("pause")}
              >
                <Pause className="mr-1.5 h-3.5 w-3.5" /> Pause
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
              disabled={control.isPending}
              onClick={() => control.mutate("cancel")}
            >
              <X className="mr-1.5 h-3.5 w-3.5" /> Cancel
            </Button>
          </div>
        )}
      </div>

      {control.isError && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          Could not update this run. It may have already completed.
        </p>
      )}

      <div className="mt-6 space-y-6">
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Live agent activity
          </h2>
          <div className="flex items-start gap-3">
            <StatusDot status={currentStatus} pulse={currentStatus === "RUNNING"} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{currentStep}</p>
              {startedAt && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Started {new Date(startedAt).toLocaleString()}
                </p>
              )}
              {completedAt && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Completed {new Date(completedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <div className="mt-5 border-t border-border pt-4">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Progress
            </h3>
            <AgentTimeline steps={progressSteps} />
          </div>
        </section>

        {currentResponse && (
          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Agent response
            </h2>
            <div className="break-words text-sm leading-relaxed [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_h1]:mt-5 [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:tracking-tight [&_h2]:mt-5 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mt-4 [&_h3]:text-sm [&_h3]:font-semibold [&_li]:mt-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-3 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_table]:w-full [&_table]:border-collapse [&_table]:text-left [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-2 [&_th]:py-1.5 [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1.5 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize]}
                components={{
                  table: ({ children }) => (
                    <div className="my-3 overflow-x-auto">
                      <table>{children}</table>
                    </div>
                  ),
                }}
              >
                {currentResponse}
              </ReactMarkdown>
            </div>
          </section>
        )}
        {currentError && (
          <section className="rounded-lg border border-destructive/30 bg-destructive/5 p-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-destructive">
              Run failed
            </h2>
            <p className="whitespace-pre-wrap break-words text-sm">
              {currentError}
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
