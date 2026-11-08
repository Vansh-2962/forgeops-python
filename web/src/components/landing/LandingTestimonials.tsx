import { motion } from "framer-motion";

const testimonials = [
  {
    quote:
      "ForgeOps cut our incident MTTR from 40 minutes to under 5. The agent identifies the root cause before we even page someone.",
    name: "Aria Mehta",
    role: "SRE Lead, Northwind",
  },
  {
    quote:
      "I asked it to containerize a legacy service and open a PR. It produced a working Dockerfile and a plan I could actually review.",
    name: "Daniel Cho",
    role: "Staff Engineer, Lineup",
  },
  {
    quote:
      "The approval flow is what sold us. Production deploys pause with the exact command. We stay in control.",
    name: "Sofia Reyes",
    role: "VP Engineering, Cadence",
  },
];

export function LandingTestimonials() {
  return (
    <section className="border-y border-white/5 bg-[#0c0c0d]">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Loved by engineers
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Teams ship faster, sleep easier.
          </h2>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="flex flex-col rounded-xl border border-white/5 bg-[#0d0d0e] p-6"
            >
              <blockquote className="flex-1 text-sm leading-relaxed text-zinc-300">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-white/5 pt-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-zinc-200 to-zinc-500 font-mono text-xs font-bold text-black">
                  {t.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
                <div>
                  <div className="text-sm font-medium text-white">{t.name}</div>
                  <div className="text-xs text-zinc-500">{t.role}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
