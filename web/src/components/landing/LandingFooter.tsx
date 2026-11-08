import { Github, Twitter, Linkedin } from "lucide-react";
import { LandingLogo } from "./LandingLogo";

const columns = [
  { title: "Product", links: ["Features", "Pricing", "Changelog", "Roadmap"] },
  { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
  { title: "Resources", links: ["Docs", "API", "Status", "Security"] },
  { title: "Legal", links: ["Privacy", "Terms", "DPA", "SOC 2"] },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-white/5 bg-[#0a0a0b]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-6">
          <div className="col-span-2">
            <LandingLogo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-400">
              The autonomous AI DevOps engineer. Plan, deploy, and resolve — on
              autopilot.
            </p>
            <div className="mt-5 flex gap-3">
              {[Github, Twitter, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="rounded-md border border-white/5 p-2 text-zinc-400 transition-colors hover:border-white/20 hover:text-white"
                  aria-label="social"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          {columns.map((c) => (
            <div key={c.title}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {c.title}
              </h4>
              <ul className="mt-3 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-zinc-400 transition-colors hover:text-white"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-6 sm:flex-row">
          <p className="text-xs text-zinc-500">
            © 2026 ForgeOps, Inc. All rights reserved.
          </p>
          <p className="font-mono text-xs text-zinc-600">
            Built with agents, for agents.
          </p>
        </div>
      </div>
    </footer>
  );
}
