import { Link } from "react-router-dom";

export function LandingLogo({ className = "" }: { className?: string }) {
  return (
    <Link to="/landing" className={`flex items-center gap-2 ${className}`}>
      <span className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-zinc-100 to-zinc-400">
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.6),transparent_60%)]" />
        <span className="relative font-mono text-sm font-bold text-black">
          F
        </span>
      </span>
      <span className="font-semibold tracking-tight text-white">ForgeOps</span>
    </Link>
  );
}
