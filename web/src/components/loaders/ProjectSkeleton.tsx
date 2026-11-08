import { Skeleton } from "@/components/ui/skeleton";

const ProjectCardSkeleton = () => {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="rounded-lg border border-border bg-card p-4"
        >
          {/* Project name + repository */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <Skeleton className="h-5 w-32" />

              <div className="mt-2 flex items-center gap-1">
                <Skeleton className="h-3 w-3 rounded-sm" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-3 space-y-1.5">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>

          {/* Health + environments */}
          <div className="mt-3 flex items-center justify-between">
            <Skeleton className="h-6 w-16 rounded-md" />

            <div className="flex items-center gap-1">
              <Skeleton className="h-5 w-16 rounded-md" />
              <Skeleton className="h-5 w-20 rounded-md" />
            </div>
          </div>

          {/* Created at */}
          <div className="mt-3 border-t border-border pt-2">
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </>
  );
};

export default ProjectCardSkeleton;