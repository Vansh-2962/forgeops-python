import { motion } from "framer-motion";
import {
  Bot,
  ShieldCheck,
  GitBranch,
  Activity,
  RotateCcw,
  Terminal,
} from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "Autonomous agent execution",
    body: "ForgeOps reads your repo, builds, deploys, and verifies — step by step, with full transparency into every tool call.",
  },
  {
    icon: ShieldCheck,
    title: "Approval-first for risky actions",
    body: "Production deployments and rollbacks pause for human approval. Nothing reaches prod without your sign-off.",
  },
  {
    icon: Activity,
    title: "Instant incident response",
    body: "Detect, investigate, and resolve incidents with root-cause analysis, evidence, and a recommended fix.",
  },
  {
    icon: GitBranch,
    title: "Git-native workflows",
    body: "Connect repositories and let ForgeOps generate Dockerfiles, suggest config, and open PRs.",
  },
  {
    icon: RotateCcw,
    title: "Automatic rollbacks",
    body: "Failed deploys roll back automatically. Health checks gate every promotion.",
  },
  {
    icon: Terminal,
    title: "Evidence-oriented logs",
    body: "Every decision is audit-traced. Replay the terminal, tool calls, and agent reasoning for any run.",
  },
];

export function LandingFeatures() {
  return (
    <section
      id="features"
      className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8"
    >
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Features
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Everything a DevOps engineer does — handled.
        </h2>
        <p className="mt-3 text-zinc-400">
          ForgeOps is a control center for agent-led infrastructure: plan,
          deploy, observe, resolve.
        </p>
      </div>
      <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-white/5 bg-white/5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.4, delay: (i % 3) * 0.06 }}
            className="bg-[#0c0c0d] p-6 transition-colors hover:bg-[#111113]"
          >
            <f.icon className="h-5 w-5 text-white" />
            <h3 className="mt-4 text-base font-medium text-white">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              {f.body}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
