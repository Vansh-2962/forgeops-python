import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import ProjectList from "@/components/projects/ProjectList";
import { Search, Github } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGithubStatus } from "@/hooks/github/useGithubStatus";
import { beginGithubConnection } from "@/api/github";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ProjectFilter = "all" | "recent" | "documented" | "needs-description";
export type ProjectSort = "name-asc" | "name-desc" | "newest" | "oldest" | "repository";

export default function Projects() {
  const githubStatus = useGithubStatus();
  const [searchTerm, setSearchTerm] = useState("");
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>("all");
  const [sortBy, setSortBy] = useState<ProjectSort>("newest");

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Projects"
        description="Your GitHub repositories and their agent activity."
      />

      {githubStatus.data && !githubStatus.data.connected && (
        <div className="mt-5 flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-medium">Connect your GitHub account</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Repositories are loaded from your own GitHub account and access
              is kept separate from other users.
            </p>
            {!githubStatus.data.configured && (
              <p role="alert" className="mt-1 text-xs text-destructive">
                GitHub OAuth is not configured on this server.
              </p>
            )}
          </div>
          <Button
            size="sm"
            disabled={!githubStatus.data.configured}
            onClick={() => beginGithubConnection("/projects")}
          >
            <Github className="mr-1.5 h-4 w-4" /> Connect GitHub
          </Button>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, repository, or description…"
            className="pl-9"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <Select
          value={projectFilter}
          onValueChange={(value: ProjectFilter) => setProjectFilter(value)}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Filter projects" />
          </SelectTrigger>
          <SelectContent
            position="popper"
            side="bottom"
            align="start"
            sideOffset={2}
          >
            <SelectItem value="all">All projects</SelectItem>
            <SelectItem value="recent">Recently added</SelectItem>
            <SelectItem value="documented">Has description</SelectItem>
            <SelectItem value="needs-description">Needs description</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={sortBy}
          onValueChange={(value: ProjectSort) => setSortBy(value)}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent
            position="popper"
            side="bottom"
            align="start"
            sideOffset={2}
          >
            <SelectItem value="name-asc">Name (A–Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z–A)</SelectItem>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="repository">Repository (A–Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ProjectList
        searchTerm={searchTerm}
        projectFilter={projectFilter}
        sortBy={sortBy}
      />
    </div>
  );
}
