import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useGetAllAgentRuns } from "@/hooks/agent/useGetAllAgentRuns";
import type {
  AgentRunRecord,
  AgentStatus,
} from "@/features/agent/agentrun.types";
import TablerLoader from "../loaders/TablerLoader";
import NotFound from "../NotFound";
import { AgentRunRow } from "./AgentRunRow";

const filters: { label: string; value: AgentStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Started", value: "STARTED" },
  { label: "Running", value: "RUNNING" },
  { label: "Paused", value: "PAUSED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Failed", value: "FAILED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const AgentRunLists = () => {
  const [filter, setFilter] = useState<AgentStatus | "all">("all");
  const { data, isLoading, isError } = useGetAllAgentRuns();
  const runs = data?.runs ?? [];
  const filteredRuns = useMemo(
    () =>
      filter === "all"
        ? runs
        : runs.filter((run: AgentRunRecord) => run.status === filter),
    [filter, runs],
  );

  return (
    <>
      {runs.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-1.5">
          {filters.map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                filter === item.value
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <TablerLoader className="mt-10" />
      ) : isError ? (
        <p role="alert" className="mt-6 text-sm text-destructive">
          Could not load agent runs. Refresh and try again.
        </p>
      ) : runs.length > 0 ? (
        <div className="mt-4 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Task</th>
                <th className="hidden px-4 py-2.5 font-medium md:table-cell">
                  Project
                </th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="hidden px-4 py-2.5 font-medium lg:table-cell">
                  Current Step
                </th>
                <th className="hidden px-4 py-2.5 font-medium sm:table-cell">
                  Duration
                </th>
                <th className="hidden px-4 py-2.5 font-medium lg:table-cell">
                  Started
                </th>
                <th className="hidden px-4 py-2.5 font-medium lg:table-cell">
                  Completed
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRuns.map((run: AgentRunRecord) => (
                <AgentRunRow key={run.id} run={run} />
              ))}
            </tbody>
          </table>
          {filteredRuns.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              No runs match this filter.
            </div>
          )}
        </div>
      ) : (
        <NotFound resource="agent runs" />
      )}
    </>
  );
};

export default AgentRunLists;
