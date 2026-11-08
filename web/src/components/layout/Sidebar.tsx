import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAgentApprovals } from "@/api/approvals";
import {
  LayoutDashboard,
  Bot,
  FolderGit2,
  AlertTriangle,
  Rocket,
  Boxes,
  ShieldCheck,
  Settings,
  LifeBuoy,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const navItems = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/runs", label: "Agent Runs", icon: Bot },
  { to: "/projects", label: "Projects", icon: FolderGit2 },
  { to: "/incidents", label: "Incidents", icon: AlertTriangle },
  { to: "/deployments", label: "Deployments", icon: Rocket },
  { to: "/infrastructure", label: "Infrastructure", icon: Boxes },
  { to: "/approvals", label: "Approvals", icon: ShieldCheck },
];

export const bottomNavItems = [
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/help", label: "Help", icon: LifeBuoy },
];

export function SidebarContent() {
  const approvalsQuery = useQuery({
    queryKey: ["agent-approvals"],
    queryFn: getAgentApprovals,
    refetchInterval: 10_000,
  });
  const pendingApprovalCount =
    approvalsQuery.data?.filter((approval) => approval.status === "pending")
      .length ?? 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background">
          <Cpu className="h-4 w-4" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-sm font-semibold tracking-tight">ForgeOps</span>
          <span className="text-[10px] text-muted-foreground">
            AI DevOps Engineer
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-2 py-3">
        <p className="px-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Workspace
        </p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.to === "/approvals" && pendingApprovalCount > 0 && (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-semibold text-background">
                {pendingApprovalCount}
              </span>
            )}
          </NavLink>
        ))}

        <div className="my-3 border-t border-border" />

        {bottomNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
