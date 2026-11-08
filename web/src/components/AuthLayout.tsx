import { useSession } from "@/lib/auth-client";
import { Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import React from "react";
import { Navigate } from "react-router-dom";
import Loading from "./loaders/Loading";

interface AuthLayoutProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

const highlights = [
  "Autonomous agent execution with full transparency",
  "Approval-first control for risky production changes",
  "Evidence-oriented logs for every run",
];

export default function AuthLayout({
  icon: Icon,
  title,
  subtitle,
  footer,
  children,
}: AuthLayoutProps) {
  const { data, isPending, error } = useSession();

  if (isPending) {
    return <Loading />;
  }

  if (error) {
    return (
      <div role="alert" className="p-8 text-center text-sm text-destructive">
        The authentication service is unavailable. Please refresh and try again.
      </div>
    );
  }

  if (data?.session) {
    return <Navigate to={"/dashboard"} />;
  }

  return (
    <div className="min-h-screen w-full bg-background lg:grid lg:grid-cols-2">
      {/* Brand / marketing panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-card p-10 lg:flex">
        {/* ambient background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(var(--primary)/0.12),transparent_55%)]" />
          <div
            className="absolute inset-0 opacity-[0.14] mask-[radial-gradient(ellipse_at_center,black,transparent_75%)]"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--border)) 1px,transparent 1px),linear-gradient(90deg,hsl(var(--border)) 1px,transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />
        </div>

        {/* brand */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
            F
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            ForgeOps
          </span>
        </div>

        {/* headline + highlights */}
        <div className="relative z-10 max-w-sm">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-foreground">
            Your AI DevOps engineer, shipping infrastructure on autopilot.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            ForgeOps plans, executes, and verifies deployments, rollbacks, and
            incident responses — asking for approval only on risky actions.
          </p>
          <ul className="mt-8 space-y-3">
            {highlights.map((h) => (
              <li
                key={h}
                className="flex items-start gap-3 text-sm text-foreground/90"
              >
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Check className="h-3.5 w-3.5" />
                </span>
                {h}
              </li>
            ))}
          </ul>
        </div>

        {/* trust line */}
        <div className="relative z-10 text-xs text-muted-foreground">
          SOC 2 ready · Cloud-agnostic · No credit card required
        </div>
      </div>

      {/* Auth card */}
      <div className="flex min-h-screen items-center justify-center px-4 py-10 lg:min-h-0">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-sm">
              <Icon
                className="h-7 w-7 text-primary-foreground"
                aria-hidden="true"
              />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            {children}
          </div>
          {footer && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {footer}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
