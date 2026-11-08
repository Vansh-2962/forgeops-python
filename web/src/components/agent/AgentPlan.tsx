import { Check, ArrowRight, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanStep } from "@/types";

export function AgentPlan({ steps }: { steps: PlanStep[] }) {
  return (
    <ol className="space-y-2">
      {steps.map((step, i) => (
        <li key={step.id} className="flex items-center gap-2.5 text-sm">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center">
            {step.status === "done" ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : step.status === "running" ? (
              <ArrowRight className="h-4 w-4 text-blue-500" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />
            )}
          </span>
          <span
            className={cn(
              "flex-1",
              step.status === "pending"
                ? "text-muted-foreground"
                : "text-foreground",
            )}
          >
            {i + 1}. {step.label}
          </span>
        </li>
      ))}
    </ol>
  );
}
