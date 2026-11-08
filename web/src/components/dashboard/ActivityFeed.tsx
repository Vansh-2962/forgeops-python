import { CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityItem } from "@/types";

const config = {
  success: { icon: CheckCircle2, className: "text-emerald-500" },
  warning: { icon: AlertTriangle, className: "text-amber-500" },
  info: { icon: Info, className: "text-blue-500" },
  error: { icon: XCircle, className: "text-red-500" },
};

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <ol className="space-y-0">
      {items.map((item, i) => {
        const cfg = config[item.type];
        const Icon = cfg.icon;
        return (
          <li key={item.id} className="relative flex gap-3 pb-4 last:pb-0">
            {i < items.length - 1 && (
              <span
                className="absolute left-[11px] top-6 h-[calc(100%-12px)] w-px bg-border"
                aria-hidden
              />
            )}
            <Icon
              className={cn("mt-0.5 h-[18px] w-[18px] shrink-0", cfg.className)}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-tight">{item.title}</p>
              <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                {item.description}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{item.time}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
