import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bot,
  FolderGit2,
  HelpCircle,
  Menu,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAgentRuns } from "@/api/agent";
import { getAllProjects } from "@/api/project";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { NewAgentTaskDialog } from "@/components/agent/NewAgentTaskDialog";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/lib/theme";
import { signOut, useSession } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [search, setSearch] = useState("");
  const pendingGAt = useRef(0);
  const { data } = useSession();
  const user = data?.user;
  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: getAllProjects,
    enabled: searchOpen,
  });
  const runsQuery = useQuery({
    queryKey: ["agent-runs", "all"],
    queryFn: () => getAgentRuns(),
    enabled: searchOpen,
  });

  const handleSignout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) {
        if (event.key.toLowerCase() === "k") {
          event.preventDefault();
          setSearchOpen(true);
        }
        return;
      }
      const target = event.target;
      if (
        event.altKey ||
        (target instanceof HTMLElement &&
          (target.isContentEditable ||
            ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
            target.closest('[role="dialog"], [role="menu"], [role="listbox"]')))
      ) {
        pendingGAt.current = 0;
        return;
      }
      if (searchOpen || taskOpen) return;

      const now = Date.now();
      if (pendingGAt.current && now - pendingGAt.current < 1000) {
        const destination =
          event.key.toLowerCase() === "r"
            ? "/runs"
            : event.key.toLowerCase() === "p"
              ? "/projects"
              : null;
        if (destination) {
          event.preventDefault();
          navigate(destination);
        }
        pendingGAt.current = 0;
        return;
      }

      if (event.key.toLowerCase() === "g") {
        pendingGAt.current = now;
      } else {
        pendingGAt.current = 0;
        if (event.key.toLowerCase() === "n") {
          event.preventDefault();
          setTaskOpen(true);
        } else if (event.key === "?") {
          event.preventDefault();
          navigate("/help");
        }
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [navigate, searchOpen, taskOpen]);

  const projects = projectsQuery.data?.data ?? [];
  const runs = runsQuery.data?.runs ?? [];

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-muted/40 px-3 text-left text-sm text-muted-foreground hover:bg-muted/70 md:max-w-sm"
          aria-label="Search repositories and agent runs"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate">Search repositories and runs…</span>
          <kbd className="hidden rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] sm:inline">
            Ctrl/⌘ K
          </kbd>
        </button>

        <Switch
          checked={theme === "dark"}
          onCheckedChange={(checked: boolean) =>
            setTheme(checked ? "dark" : "light")
          }
          aria-label="Toggle dark theme"
        />

        <div className="flex items-center justify-end gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Open account menu"
              >
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarImage src={user?.image || ""} alt={user?.name} />
                  <AvatarFallback className="bg-foreground text-background text-xs font-semibold">
                    {user?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-bold">{user?.name}</span>
                  <span className="text-xs text-accent-foreground">
                    {user?.email}
                  </span>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleSignout}
                className="text-destructive focus:text-destructive"
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <CommandDialog
        open={searchOpen}
        onOpenChange={(open) => {
          setSearchOpen(open);
          if (!open) setSearch("");
        }}
        title="Search ForgeOps"
        description="Search your repositories and agent runs."
      >
        <Command shouldFilter>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder="Search repositories and runs…"
          />
          <CommandList>
            <CommandEmpty>
              {projectsQuery.isLoading || runsQuery.isLoading
                ? "Loading repositories and runs…"
                : "No matching repositories or runs."}
            </CommandEmpty>
            {projectsQuery.isError && (
              <p role="alert" className="px-3 py-2 text-xs text-destructive">
                Could not load repositories.
              </p>
            )}
            {runsQuery.isError && (
              <p role="alert" className="px-3 py-2 text-xs text-destructive">
                Could not load agent runs.
              </p>
            )}
            {projects.length > 0 && (
              <CommandGroup heading="Repositories">
                {projects.map((project) => (
                  <CommandItem
                    key={project.id}
                    value={`${project.name} ${project.repository.fullName} ${project.description ?? ""}`}
                    onSelect={() => {
                      setSearchOpen(false);
                      navigate(`/projects/${encodeURIComponent(project.id)}`);
                    }}
                  >
                    <FolderGit2 className="h-4 w-4" />
                    <span className="truncate">{project.name}</span>
                    <span className="ml-auto truncate text-xs text-muted-foreground">
                      {project.repository.fullName}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {runs.length > 0 && (
              <CommandGroup heading="Agent runs">
                {runs.map((run) => (
                  <CommandItem
                    key={run.id}
                    value={`${run.prompt ?? ""} ${run.projectName ?? ""} ${run.repositoryFullName ?? ""} ${run.status}`}
                    onSelect={() => {
                      setSearchOpen(false);
                      navigate(`/runs/${encodeURIComponent(run.id)}`);
                    }}
                  >
                    <Bot className="h-4 w-4" />
                    <span className="truncate">{run.prompt || "Agent run"}</span>
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                      {run.status.toLowerCase()}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            <CommandGroup heading="Navigation">
              <CommandItem
                value="keyboard shortcuts help"
                onSelect={() => {
                  setSearchOpen(false);
                  navigate("/help");
                }}
              >
                <HelpCircle className="h-4 w-4" />
                <span>Keyboard shortcuts</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>

      <NewAgentTaskDialog open={taskOpen} onOpenChange={setTaskOpen} />
    </>
  );
}
