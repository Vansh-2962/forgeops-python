import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const tiers = [
  {
    name: "Hobby",
    price: "$0",
    period: "/mo",
    desc: "For solo developers and side projects.",
    cta: "Start free",
    highlight: false,
    features: [
      "1 project",
      "Dev environment only",
      "50 agent runs / mo",
      "Community support",
    ],
  },
  {
    name: "Team",
    price: "$49",
    period: "/seat/mo",
    desc: "For growing engineering teams.",
    cta: "Start 14-day trial",
    highlight: true,
    features: [
      "Unlimited projects",
      "All environments",
      "Unlimited agent runs",
      "Approval workflows",
      "Incident auto-response",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For organizations with scale & compliance needs.",
    cta: "Contact sales",
    highlight: false,
    features: [
      "SSO / SAML",
      "Audit log export",
      "Custom models & retention",
      "Dedicated support",
      "SLA",
    ],
  },
];

export function LandingPricing() {
  return (
    <section
      id="pricing"
      className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8"
    >
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Pricing
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Simple, usage-based pricing.
        </h2>
        <p className="mt-3 text-zinc-400">
          Start free. Upgrade when your infrastructure grows up.
        </p>
      </div>
      <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={cn(
              "relative flex flex-col rounded-xl border p-6",
              t.highlight
                ? "border-white/20 bg-[#111113] shadow-2xl shadow-black/40"
                : "border-white/5 bg-[#0d0d0e]",
            )}
          >
            {t.highlight && (
              <span className="absolute -top-3 left-6 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-medium text-black">
                Most popular
              </span>
            )}
            <h3 className="text-sm font-medium text-white">{t.name}</h3>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-semibold tracking-tight text-white">
                {t.price}
              </span>
              <span className="text-sm text-zinc-500">{t.period}</span>
            </div>
            <p className="mt-2 text-sm text-zinc-400">{t.desc}</p>
            <Link to="/register" className="mt-6">
              <Button
                className={cn(
                  "w-full",
                  t.highlight ? "bg-white text-black hover:bg-zinc-200" : "",
                )}
                variant={t.highlight ? "default" : "outline"}
              >
                {t.cta}
              </Button>
            </Link>
            <ul className="mt-6 space-y-2.5 text-sm">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-zinc-300">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
