import { motion } from "framer-motion";
import {
  Cpu,
  AlertCircle,
  Activity,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

const stats = [
  {
    icon: CheckCircle2,
    label: "Resolved",
    value: "Redis pool exhaustion",
    tone: "text-emerald-400",
  },
  { icon: Cpu, label: "CPU", value: "34%", tone: "text-zinc-300" },
  {
    icon: Activity,
    label: "Error rate",
    value: "0.02%",
    tone: "text-zinc-300",
  },
  {
    icon: AlertCircle,
    label: "Incidents (7d)",
    value: "1",
    tone: "text-amber-400",
  },
];

export function LandingShowcase() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Observability
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            See your infrastructure the way your agent does.
          </h2>
          <p className="mt-3 text-zinc-400">
            Live health, metrics, and incident context in one control center —
            so when ForgeOps resolves an issue, you can see exactly what it saw
            and why.
          </p>
          <ul className="mt-6 space-y-2.5 text-sm text-zinc-300">
            {[
              "Real-time service health across dev, staging, and prod",
              "Agent-written root-cause analysis with evidence",
              "One-click rollback and replay of any run",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                {t}
              </li>
            ))}
          </ul>
          <a
            href="#pricing"
            className="mt-7 inline-flex items-center gap-1.5 text-sm font-medium text-white hover:gap-2.5 transition-all"
          >
            Explore the control center <ArrowRight className="h-4 w-4" />
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="rounded-xl border border-white/10 bg-[#0d0d0e] p-5 shadow-2xl shadow-black/50"
        >
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <span className="font-mono text-xs text-zinc-500">
              payments-service / production
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{" "}
              Operational
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-lg border border-white/5 bg-[#111113] px-3 py-3"
              >
                <div className="flex items-center gap-2">
                  <s.icon className={`h-3.5 w-3.5 ${s.tone}`} />
                  <span className="text-[11px] text-zinc-500">{s.label}</span>
                </div>
                <div className="mt-1 font-mono text-sm text-white">
                  {s.value}
                </div>
              </div>
            ))}
          </div>
          {/* mini sparkline */}
          <div className="mt-4 rounded-lg border border-white/5 bg-[#111113] p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] text-zinc-500">Requests / min</span>
              <span className="font-mono text-[11px] text-zinc-400">↑ 12%</span>
            </div>
            <svg viewBox="0 0 300 60" className="h-14 w-full">
              <polyline
                fill="none"
                stroke="url(#g)"
                strokeWidth="2"
                points="0,42 30,38 60,40 90,30 120,33 150,22 180,26 210,16 240,20 270,10 300,8"
              />
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
