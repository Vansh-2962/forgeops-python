import { Link } from "react-router-dom";
import { RunStatusBadge, StatusDot } from "../shared/StatusBadge";
import { useAgentRunEvents } from "@/features/agent/use-agent-run-events";
import { formatDuration } from "@/features/agent/helpers/formatDuration";
import type { AgentRunRecord } from "@/features/agent/agentrun.types";

export function AgentRunRow({
  run,
  projectContext = false,
}: {
  run: AgentRunRecord;
  projectContext?: boolean;
}) {
  const { status, currentStep, duration, startedAt, completedAt } =
    useAgentRunEvents({
      agentRunId: run.id,
      initialStatus: run.status,
      initialStartedAt: run.startedAt,
      initialCompletedAt: run.completedAt,
      initialCurrentStep: run.currentRunStep,
      enabled: !["COMPLETED", "FAILED", "CANCELLED"].includes(run.status),
    });

  return (
    <tr className="transition-colors hover:bg-muted/40">
      <td className="px-4 py-3">
        <Link to={`/runs/${run.id}`} className="block max-w-96 truncate font-medium">
          {run.prompt || "Agent run"}
        </Link>
      </td>
      {!projectContext && (
        <td className="hidden px-4 py-3 font-mono text-xs text-muted-foreground md:table-cell">
          {run.projectId ? (
            <Link to={`/projects/${encodeURIComponent(run.projectId)}`}>
              {run.projectName || "Project"}
            </Link>
          ) : (
            "—"
          )}
        </td>
      )}
      <td className="px-4 py-3">
        <RunStatusBadge status={status} />
      </td>
      <td className="hidden px-4 py-3 lg:table-cell">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <StatusDot status={status} />
          {currentStep || "—"}
        </span>
      </td>
      <td className="hidden px-4 py-3 font-mono text-xs text-muted-foreground sm:table-cell">
        {startedAt ? formatDuration(duration) : "—"}
      </td>
      {!projectContext && (
        <>
          <td className="hidden px-4 py-3 text-xs text-muted-foreground lg:table-cell">
            {startedAt ? new Date(startedAt).toLocaleString() : "—"}
          </td>
          <td className="hidden px-4 py-3 text-xs text-muted-foreground lg:table-cell">
            {completedAt ? new Date(completedAt).toLocaleString() : "—"}
          </td>
        </>
      )}
    </tr>
  );
}
