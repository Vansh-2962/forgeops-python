import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Terminal,
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function MiniDashboard() {
  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-[#0d0d0e] shadow-2xl shadow-black/50">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_50%)]" />
      {/* window bar */}
      <div className="flex items-center gap-1.5 border-b border-white/5 px-3 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
        <span className="ml-2 font-mono text-[11px] text-zinc-500">
          forgeops — agent run: deploy-production-api
        </span>
      </div>
      <div className="grid grid-cols-[1fr_1.3fr] gap-3 p-3">
        {/* mini timeline */}
        <div className="space-y-2.5 rounded-lg border border-white/5 bg-[#111112] p-3">
          <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            Agent Activity
          </span>
          {[
            {
              icon: CheckCircle2,
              tone: "text-emerald-400",
              label: "Repository analyzed",
            },
            {
              icon: CheckCircle2,
              tone: "text-emerald-400",
              label: "Dockerfile generated",
            },
            {
              icon: Loader2,
              tone: "text-blue-400",
              label: "Building image…",
              spin: true,
            },
            {
              icon: Terminal,
              tone: "text-zinc-600",
              label: "Security scan",
              muted: true,
            },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px]">
              <s.icon
                className={`h-3.5 w-3.5 ${s.tone} ${s.spin ? "animate-spin" : ""}`}
              />
              <span className={s.muted ? "text-zinc-600" : "text-zinc-300"}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
        {/* mini terminal + plan */}
        <div className="space-y-3">
          <div className="rounded-lg border border-white/5 bg-black/40 p-3 font-mono text-[10.5px] leading-relaxed">
            <div className="text-zinc-500">$ forgeops deploy prod</div>
            <div className="text-emerald-400">
              ✓ Build succeeded — sha a1b9c2
            </div>
            <div className="text-blue-400">→ Pushing image to registry…</div>
            <div className="text-zinc-500">- Waiting for approval (prod)</div>
            <div className="mt-1 inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400">
              <ShieldCheck className="h-3 w-3" /> Approval required
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              ["Tokens", "18.4k"],
              ["Tool calls", "27"],
              ["Duration", "2m 14s"],
              ["Confidence", "97%"],
            ].map(([k, v]) => (
              <div
                key={k}
                className="rounded-lg border border-white/5 bg-[#111112] px-3 py-2"
              >
                <div className="text-[10px] text-zinc-500">{k}</div>
                <div className="font-mono text-xs text-white">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      {/* gradient mesh */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(120,119,198,0.18),transparent),radial-gradient(40%_40%_at_80%_20%,rgba(59,130,246,0.10),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent,#0a0a0b)]" />
      {/* grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 0%, black, transparent)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 pt-20 pb-24 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <a
            href="#features"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300 backdrop-blur"
          >
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Now with autonomous incident resolution
            <ArrowRight className="h-3 w-3" />
          </a>
          <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Your AI DevOps engineer,
            <span className="block bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-transparent">
              shipping infrastructure on autopilot
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-zinc-400">
            ForgeOps plans, executes, and verifies deployments, rollbacks, and
            incident responses — asking for approval only on risky actions.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/register">
              <Button
                size="lg"
                className="group gap-2 bg-white text-black hover:bg-zinc-200"
              >
                Start for free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <a href="#how">
              <Button
                size="lg"
                variant="ghost"
                className="text-zinc-300 hover:text-white"
              >
                Watch it work
              </Button>
            </a>
          </div>
          <p className="mt-4 text-xs text-zinc-500">
            No credit card required · SOC 2 ready · Cloud-agnostic
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative mx-auto mt-16 max-w-4xl"
        >
          <div className="absolute -inset-x-10 -top-10 h-40 bg-[radial-gradient(ellipse,rgba(255,255,255,0.08),transparent)] blur-2xl" />
          <div className="relative">
            <MiniDashboard />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
