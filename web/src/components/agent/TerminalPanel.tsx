import { Terminal } from "lucide-react";

export function TerminalPanel({ lines }: { lines: string[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-[#0b0b0c] dark:bg-black/60">
      <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
        <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Terminal
        </span>
      </div>
      <pre className="overflow-x-auto px-4 py-3 font-mono text-xs leading-relaxed text-zinc-300">
        {lines.length === 0 ? (
          <span className="text-muted-foreground">No output yet.</span>
        ) : (
          lines.map((line, i) => (
            <div key={i} className="whitespace-pre">
              {line.startsWith("$") ? (
                <span className="text-emerald-400">{line}</span>
              ) : line.startsWith("✓") ? (
                <span className="text-emerald-400">{line}</span>
              ) : line.startsWith("✗") ? (
                <span className="text-red-400">{line}</span>
              ) : (
                <span>{line || " "}</span>
              )}
            </div>
          ))
        )}
      </pre>
    </div>
  );
}
