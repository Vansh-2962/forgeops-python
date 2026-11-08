import {
  Ban,
  CheckCircle2,
  Circle,
  Loader2,
  PauseCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimelineStep, StepStatus } from "@/types";

const stepIcon: Record<StepStatus, typeof Circle> = {
  done: CheckCircle2,
  running: Loader2,
  pending: Circle,
  failed: XCircle,
  paused: PauseCircle,
  cancelled: Ban,
};

const stepColor: Record<StepStatus, string> = {
  done: "text-emerald-500",
  running: "text-blue-500",
  pending: "text-muted-foreground",
  failed: "text-red-500",
  paused: "text-amber-500",
  cancelled: "text-muted-foreground",
};

export function AgentTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="space-y-0">
      {steps.map((step, i) => {
        const Icon = stepIcon[step.status];
        const isLast = i === steps.length - 1;
        return (
          <li key={step.id} className="relative flex gap-3 pb-5 last:pb-0">
            {!isLast && (
              <span
                className={cn(
                  "absolute left-[11px] top-6 h-[calc(100%-16px)] w-px",
                  step.status === "done"
                    ? "bg-emerald-500/50"
                    : "bg-border/50",
                )}
                aria-hidden
              />
            )}
            <Icon
              className={cn(
                "mt-0.5 h-[18px] w-[18px] shrink-0",
                stepColor[step.status],
                step.status === "running" && "animate-spin",
              )}
            />
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-sm leading-tight",
                  step.status === "pending"
                    ? "text-muted-foreground"
                    : "font-medium text-foreground",
                )}
              >
                {step.label}
              </p>
              {step.detail && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {step.detail}
                </p>
              )}
              {step.timestamp && (
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {step.timestamp}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
