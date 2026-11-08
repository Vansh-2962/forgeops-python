const logos = [
  "LINEAR",
  "VERCEL",
  "RENDER",
  "RAILWAY",
  "PLANETSCALE",
  "CLOUDFLARE",
];

export function LandingLogos() {
  return (
    <section className="border-y border-white/5 bg-[#0c0c0d]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-center text-xs uppercase tracking-widest text-zinc-500">
          Trusted by teams building on the modern cloud
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {logos.map((l) => (
            <span
              key={l}
              className="font-mono text-sm font-semibold tracking-widest text-zinc-600"
            >
              {l}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
