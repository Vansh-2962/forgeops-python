import { GitBranch } from "lucide-react";
import { Link } from "react-router-dom";
import { useGetAllProjects } from "@/hooks/projects/useGetAllProjects";
import type { ProjectType } from "@/types/project";
import { formatRelativeDate } from "@/utils/formatDate";
import ProjectCardSkeleton from "../loaders/ProjectSkeleton";
import type { ProjectFilter, ProjectSort } from "@/pages/Projects";

interface ProjectListProps {
  searchTerm: string;
  projectFilter: ProjectFilter;
  sortBy: ProjectSort;
}

const ProjectList = ({ searchTerm, projectFilter, sortBy }: ProjectListProps) => {
  const { data, isLoading, isError } = useGetAllProjects();
  const projects = (data?.data ?? [])
    .filter((project) => {
      const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          project.name,
          project.repository.fullName,
          project.description ?? "",
        ].some((value) => value.toLocaleLowerCase().includes(normalizedSearch));

      if (!matchesSearch) return false;

      const hasDescription = Boolean(project.description?.trim());
      switch (projectFilter) {
        case "recent": {
          const createdAt = new Date(project.createdAt).getTime();
          return (
            Number.isFinite(createdAt) &&
            createdAt >= Date.now() - 7 * 24 * 60 * 60 * 1000
          );
        }
        case "documented":
          return hasDescription;
        case "needs-description":
          return !hasDescription;
        case "all":
          return true;
      }
    })
    .sort((left, right) => {
      switch (sortBy) {
        case "name-asc":
          return left.name.localeCompare(right.name);
        case "name-desc":
          return right.name.localeCompare(left.name);
        case "newest":
          return (
            new Date(right.createdAt).getTime() -
            new Date(left.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(left.createdAt).getTime() -
            new Date(right.createdAt).getTime()
          );
        case "repository":
          return left.repository.fullName.localeCompare(
            right.repository.fullName,
          );
      }
    });

  return (
    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {isLoading ? (
        <ProjectCardSkeleton />
      ) : isError ? (
        <p role="alert" className="col-span-full py-8 text-center text-sm text-destructive">
          Could not load projects. Refresh and try again.
        </p>
      ) : projects.length > 0 ? (
        projects.map((p: ProjectType) => (
          <Link
            key={p.id}
            to={`/projects/${p.id}`}
            className="group rounded-lg border border-border bg-card p-4 transition-colors hover:border-foreground/20"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium">{p.name}</p>
                <p className="mt-0.5 flex items-center gap-1 truncate font-mono text-xs text-muted-foreground">
                  <GitBranch className="h-3 w-3" />
                  github.com/{p.repository.fullName}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {p.description || "No description provided."}
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <GitBranch className="h-3 w-3" />
              <span className="font-mono">{p.repository.defaultBranch}</span>
            </div>
            <p className="mt-3 border-t border-border pt-2 text-xs text-muted-foreground">
              {formatRelativeDate(p.createdAt)}
            </p>
          </Link>
        ))
      ) : (
        <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
          {data?.data.length
            ? "No projects match your search and filters."
            : "No projects found. Connect a repository to get started."}
        </p>
      )}
    </div>
  );
};

export default ProjectList;
