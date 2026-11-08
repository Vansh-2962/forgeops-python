import { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { SidebarContent } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { useSession } from "@/lib/auth-client";
import Loading from "../loaders/Loading";

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data, isPending, error } = useSession();

  if (isPending) {
    return <Loading />;
  }

  if (error) {
    return (
      <p role="alert" className="p-8 text-center text-sm text-destructive">
        The authentication service is unavailable. Please refresh and try again.
      </p>
    );
  }

  if (!data?.session) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <aside className="hidden w-56 shrink-0 border-r border-border md:block">
        <SidebarContent />
      </aside>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
