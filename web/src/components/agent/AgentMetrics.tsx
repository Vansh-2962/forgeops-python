import type { AgentMetrics as Metrics } from "@/types";

export function AgentMetricsPanel({ metrics }: { metrics: Metrics }) {
  const rows = [
    { label: "Model", value: metrics.model },
    { label: "Tokens", value: metrics.tokens },
    { label: "Tool Calls", value: String(metrics.toolCalls) },
    { label: "Duration", value: metrics.duration },
  ];
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border">
      {rows.map((r) => (
        <div key={r.label} className="bg-card px-3 py-2.5">
          <dt className="text-xs text-muted-foreground">{r.label}</dt>
          <dd className="mt-0.5 font-mono text-sm font-medium text-foreground">
            {r.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
