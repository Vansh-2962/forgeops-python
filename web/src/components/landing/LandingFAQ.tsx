import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "How does ForgeOps decide what needs approval?",
    a: "Any action targeting production — deployments, rollbacks, scaling, or destructive changes — pauses for human approval. You see the exact command and the reason before you approve or reject.",
  },
  {
    q: "Can I use my own infrastructure?",
    a: "Yes. ForgeOps is cloud-agnostic and connects to your existing repos, registries, and clusters via Git, Docker, and Kubernetes.",
  },
  {
    q: "What does an agent run look like?",
    a: "Each run is a transparent timeline: a plan, the tool calls it made, a live terminal, and metrics. You can replay any run and inspect every decision.",
  },
  {
    q: "Is my code sent to third parties?",
    a: "Only what the agent reads to perform a task is processed. You control which repositories are connected and can disconnect at any time.",
  },
];

export function LandingFAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="border-y border-white/5 bg-[#0c0c0d]">
      <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            FAQ
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Questions, answered.
          </h2>
        </div>
        <div className="mt-10 divide-y divide-white/5 rounded-xl border border-white/5 bg-[#0d0d0e]">
          {faqs.map((f, i) => (
            <div key={i}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-sm font-medium text-white">{f.q}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-zinc-500 transition-transform",
                    open === i && "rotate-180",
                  )}
                />
              </button>
              {open === i && (
                <p className="px-5 pb-4 text-sm leading-relaxed text-zinc-400">
                  {f.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
