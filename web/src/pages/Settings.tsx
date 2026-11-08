import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Github, Monitor, Moon, Sun } from "lucide-react";
import { disconnectGithub, beginGithubConnection } from "@/api/github";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { useGithubStatus } from "@/hooks/github/useGithubStatus";
import { cn } from "@/lib/utils";
import { useTheme, type Theme } from "@/lib/theme";

const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const githubStatus = useGithubStatus();
  const disconnectMutation = useMutation({
    mutationFn: disconnectGithub,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["github-connection-status"],
        }),
        queryClient.invalidateQueries({ queryKey: ["projects"] }),
        queryClient.invalidateQueries({ queryKey: ["github-repos"] }),
      ]);
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Settings"
        description="Manage your appearance and connected accounts."
      />

      <div className="mt-5 space-y-4">
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Appearance</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Choose the theme used across ForgeOps.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={theme === option.value}
                onClick={() => setTheme(option.value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-md border px-3 py-4 text-xs transition-colors",
                  theme === option.value
                    ? "border-foreground/40 bg-accent text-foreground"
                    : "border-border text-muted-foreground hover:border-foreground/20",
                )}
              >
                <option.icon className="h-4 w-4" />
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <section
          id="repositories"
          className="rounded-lg border border-border bg-card p-5"
        >
          <h2 className="text-sm font-semibold">GitHub account</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Connect your GitHub account to list repositories and run agent
            tasks against them.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {githubStatus.isLoading ? (
              <p className="text-sm text-muted-foreground">
                Checking GitHub connection…
              </p>
            ) : githubStatus.data?.connected ? (
              <>
                <p className="text-sm">
                  Connected as{" "}
                  <span className="font-medium">
                    @{githubStatus.data.login}
                  </span>
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={disconnectMutation.isPending}
                  onClick={() => disconnectMutation.mutate()}
                >
                  {disconnectMutation.isPending
                    ? "Disconnecting…"
                    : "Disconnect"}
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                disabled={!githubStatus.data?.configured || githubStatus.isError}
                onClick={() => beginGithubConnection("/settings#repositories")}
              >
                <Github className="mr-1.5 h-4 w-4" />
                Connect GitHub
              </Button>
            )}
          </div>
          {githubStatus.data && !githubStatus.data.configured && (
            <p role="alert" className="mt-2 text-xs text-destructive">
              The server administrator must configure GitHub OAuth before
              accounts can connect.
            </p>
          )}
          {(githubStatus.isError || disconnectMutation.isError) && (
            <p role="alert" className="mt-2 text-xs text-destructive">
              Could not load or update GitHub connection status. Refresh and
              try again.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
