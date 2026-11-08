import { useState } from "react";
import { ChevronRight, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolCall } from "@/types";

const statusConfig = {
  completed: { icon: CheckCircle2, color: "text-emerald-500" },
  running: { icon: Loader2, color: "text-blue-500" },
  failed: { icon: XCircle, color: "text-red-500" },
};

export function ToolCallCard({ call }: { call: ToolCall }) {
  const [open, setOpen] = useState(false);
  const cfg = statusConfig[call.status];
  const Icon = cfg.icon;

  return (
    <div className="rounded-md border border-border bg-background">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-90",
          )}
        />
        <Icon
          className={cn(
            "h-4 w-4 shrink-0",
            cfg.color,
            call.status === "running" && "animate-spin",
          )}
        />
        <span className="flex-1 text-sm">{call.summary}</span>
      </button>
      {open && (
        <div className="border-t border-border px-3 py-2.5">
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-xs">
            <dt className="text-muted-foreground">Tool</dt>
            <dd className="text-foreground">{call.tool}</dd>
            <dt className="text-muted-foreground">Target</dt>
            <dd className="text-foreground">{call.target}</dd>
            <dt className="text-muted-foreground">Status</dt>
            <dd className={cn("capitalize", cfg.color)}>{call.status}</dd>
            {call.detail && (
              <>
                <dt className="text-muted-foreground">Note</dt>
                <dd className="text-foreground">{call.detail}</dd>
              </>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
