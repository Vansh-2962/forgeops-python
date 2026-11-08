import { StatusDot } from "@/components/shared/StatusBadge";
import type { InfrastructureService } from "@/types";

export function InfrastructureHealth({
  environments,
}: {
  environments: Record<string, InfrastructureService[]>;
}) {
  return (
    <div className="space-y-4">
      {Object.entries(environments).map(([env, services]) => (
        <div key={env}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {env}
          </p>
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {services.map((s) => (
              <div
                key={s.name}
                className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2"
              >
                <span className="font-mono text-sm">{s.name}</span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <StatusDot status={s.status} />
                  <span className="capitalize">{s.status}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
