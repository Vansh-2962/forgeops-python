import { motion } from "framer-motion";
import { Brain, Wrench, ShieldCheck, CheckCircle2 } from "lucide-react";

const steps = [
  {
    n: "01",
    icon: Brain,
    title: "Plan",
    body: "Describe what you need. ForgeOps analyzes the repository and produces a concrete execution plan.",
  },
  {
    n: "02",
    icon: Wrench,
    title: "Execute",
    body: "It calls tools — Git, Docker, Kubernetes, shell — building, deploying, and verifying each step.",
  },
  {
    n: "03",
    icon: ShieldCheck,
    title: "Approve",
    body: "Risky production actions pause for your approval, with the exact command and reason shown.",
  },
  {
    n: "04",
    icon: CheckCircle2,
    title: "Verify",
    body: "Health checks, metrics, and logs confirm the change. Failures roll back automatically.",
  },
];

export function LandingWorkflow() {
  return (
    <section id="how" className="border-y border-white/5 bg-[#0c0c0d]">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            From prompt to production — safely.
          </h2>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="relative rounded-xl border border-white/5 bg-[#0d0d0e] p-6"
            >
              <div className="flex items-center justify-between">
                <s.icon className="h-5 w-5 text-white" />
                <span className="font-mono text-xs text-zinc-600">{s.n}</span>
              </div>
              <h3 className="mt-4 text-base font-medium text-white">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {s.body}
              </p>
              {i < 3 && (
                <div className="absolute -right-2 top-1/2 hidden h-px w-4 bg-white/10 lg:block" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
