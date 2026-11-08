import {
  Loader2,
  Circle,
  CheckCircle2,
  XCircle,
  Clock,
  CircleX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RiskLevel, Severity, HealthStatus } from "@/types";
import type { AgentStatus } from "@/features/agent/agentrun.types";

interface StatusDotProps {
  status: HealthStatus | AgentStatus;
  className?: string;
  pulse?: boolean;
}

const dotColors: Record<string, string> = {
  healthy: "bg-emerald-500",
  running: "bg-blue-500",
  started: "bg-blue-500",
  paused: "bg-amber-500",
  completed: "bg-emerald-500",
  degraded: "bg-amber-500",
  waiting_approval: "bg-amber-500",
  failed: "bg-red-500",
  cancelled: "bg-rose-500",
  down: "bg-red-500",
  unknown: "bg-muted-foreground",
};

export function StatusDot({ status, className, pulse }: StatusDotProps) {
  const animate = pulse ?? status === "RUNNING";
  return (
    <span className="relative inline-flex h-2 w-2 shrink-0">
      {animate && (
        <span
          className={cn(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
            dotColors[String(status).toLowerCase()],
          )}
        />
      )}
      <span
        className={cn(
          "relative inline-flex h-2 w-2 rounded-full",
          dotColors[String(status).toLowerCase()] ?? "bg-muted-foreground",
          className,
        )}
      />
    </span>
  );
}

const runStatusConfig: Record<
  AgentStatus,
  { label: string; className: string; icon: typeof Circle }
> = {
  RUNNING: {
    label: "Running",
    className:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    icon: Loader2,
  },
  STARTED: {
    label: "Started",
    className:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    icon: Clock,
  },
  PAUSED: {
    label: "Paused",
    className:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    icon: Clock,
  },
  COMPLETED: {
    label: "Completed",
    className:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    icon: CheckCircle2,
  },
  FAILED: {
    label: "Failed",
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    icon: XCircle,
  },
  CANCELLED: {
    label: "Cancelled",
    className:
      "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    icon: CircleX,
  },
};

export function RunStatusBadge({ status }: { status: AgentStatus }) {
  const cfg = runStatusConfig[status];
  const Icon = cfg.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        cfg.className,
      )}
    >
      <Icon className={cn("h-3 w-3", status === "RUNNING" && "animate-spin")} />
      {cfg.label}
    </span>
  );
}

const riskConfig: Record<
  RiskLevel | Severity,
  { label: string; className: string }
> = {
  low: {
    label: "Low",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  medium: {
    label: "Medium",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  high: {
    label: "High",
    className: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  critical: {
    label: "Critical",
    className: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
};

export function RiskBadge({ level }: { level: RiskLevel | Severity }) {
  const cfg = riskConfig[level];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
        cfg?.className,
      )}
    >
      {cfg?.label}
    </span>
  );
}

export function HealthBadge({ status }: { status: HealthStatus }) {
  const map: Record<HealthStatus, { label: string; className: string }> = {
    healthy: {
      label: "Healthy",
      className: "text-emerald-600 dark:text-emerald-400",
    },
    degraded: {
      label: "Degraded",
      className: "text-amber-600 dark:text-amber-400",
    },
    down: { label: "Down", className: "text-red-600 dark:text-red-400" },
    unknown: {
      label: "Unknown",
      className: "text-muted-foreground",
    },
  };
  const cfg = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        cfg?.className,
      )}
    >
      <StatusDot status={status} />
      {cfg?.label}
    </span>
  );
}
