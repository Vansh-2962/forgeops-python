import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ShieldAlert, X } from "lucide-react";
import { Link } from "react-router-dom";
import { decideAgentApproval, getAgentApprovals } from "@/api/approvals";
import { PageHeader } from "@/components/shared/PageHeader";
import { RiskBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import type { AgentApproval } from "@/features/agent/approval.types";
import { cn } from "@/lib/utils";

const statusStyles = {
  pending: "border-border bg-muted text-muted-foreground",
  approved:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  rejected: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
  cancelled: "border-border bg-muted text-muted-foreground",
} as const;

function formatToolName(toolName: string) {
  return toolName
    .replace(/_repository_/g, " ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function Approvals() {
  const queryClient = useQueryClient();
  const approvalsQuery = useQuery({
    queryKey: ["agent-approvals"],
    queryFn: getAgentApprovals,
    refetchInterval: 5_000,
  });
  const decisionMutation = useMutation({
    mutationFn: ({
      approvalId,
      decision,
    }: {
      approvalId: string;
      decision: "approve" | "reject";
    }) => decideAgentApproval(approvalId, decision),
    onSuccess: async (approval) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["agent-approvals"] }),
        queryClient.invalidateQueries({
          queryKey: ["agent-run", approval.runId],
        }),
        queryClient.invalidateQueries({ queryKey: ["agent-runs"] }),
      ]);
    },
  });
  const approvals = approvalsQuery.data ?? [];
  const pendingCount = approvals.filter(
    (approval) => approval.status === "pending",
  ).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Approvals"
        description="Review agent-proposed GitHub changes. Mutating actions stay blocked until you approve them."
      />

      <div className="mt-5 space-y-3">
        {approvalsQuery.isLoading ? (
          <p className="rounded-lg border border-border p-6 text-sm text-muted-foreground">
            Loading approval requests…
          </p>
        ) : approvalsQuery.isError ? (
          <p
            role="alert"
            className="rounded-lg border border-border p-6 text-sm text-destructive"
          >
            Could not load approval requests. Refresh and try again.
          </p>
        ) : approvals.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <ShieldAlert className="mx-auto h-5 w-5 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">No approval requests</p>
            <p className="mt-1 text-xs text-muted-foreground">
              When the agent proposes a GitHub change, it will wait here for
              your decision.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {pendingCount} awaiting your decision
            </p>
            {approvals.map((approval) => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                isPending={decisionMutation.isPending}
                onDecision={(decision) =>
                  decisionMutation.mutate({
                    approvalId: approval.id,
                    decision,
                  })
                }
              />
            ))}
          </>
        )}

        {decisionMutation.isError && (
          <p role="alert" className="text-sm text-destructive">
            Could not record your decision. The request may already have been
            decided; refresh and try again.
          </p>
        )}
      </div>
    </div>
  );
}

function ApprovalCard({
  approval,
  isPending,
  onDecision,
}: {
  approval: AgentApproval;
  isPending: boolean;
  onDecision: (decision: "approve" | "reject") => void;
}) {
  const isOpen = approval.status === "pending";

  return (
    <article
      className={cn(
        "rounded-lg border border-border border-l-4 bg-card p-5",
        approval.risk === "low" && "border-l-emerald-500",
        approval.risk === "medium" && "border-l-amber-500",
        approval.risk === "high" && "border-l-orange-500",
        approval.risk === "critical" && "border-l-red-500",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">
              {formatToolName(approval.toolName)}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Agent wants to make this GitHub change:
            </p>
          </div>
        </div>
        <RiskBadge level={approval.risk} />
      </div>

      <pre className="mt-3 max-h-72 overflow-auto rounded-md border border-border bg-[#0b0b0c] px-3 py-2 font-mono text-xs text-zinc-200">
        {JSON.stringify(approval.arguments, null, 2)}
      </pre>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>Requested {new Date(approval.createdAt).toLocaleString()}</span>
        <Link
          to={`/runs/${encodeURIComponent(approval.runId)}`}
          className="text-primary hover:underline"
        >
          View agent run
        </Link>
      </div>

      {isOpen ? (
        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => onDecision("reject")}
          >
            <X className="h-3.5 w-3.5" /> Reject
          </Button>
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => onDecision("approve")}
          >
            <Check className="h-3.5 w-3.5" /> Approve action
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            "mt-4 flex items-center gap-2 rounded-md border px-3 py-2 text-sm capitalize",
            statusStyles[approval.status],
          )}
        >
          {approval.status === "approved" ? (
            <Check className="h-4 w-4" />
          ) : (
            <X className="h-4 w-4" />
          )}
          {approval.status}
          {approval.decidedAt && (
            <span className="text-xs opacity-80">
              · {new Date(approval.decidedAt).toLocaleString()}
            </span>
          )}
        </div>
      )}
    </article>
  );
}
