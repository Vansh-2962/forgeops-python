import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const TablerLoader = ({ className }: { className?: string }) => {
  return (
    <div className={cn(className, `w-full rounded-lg border`)}>
      {/* Table Header */}
      <div className="grid grid-cols-5 gap-4 border-b px-4 py-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="ml-auto h-4 w-16" />
      </div>

      {/* Table Rows */}
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="grid grid-cols-5 items-center gap-4 border-b px-4 py-4 last:border-0"
        >
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="ml-auto h-8 w-8 rounded-md" />
        </div>
      ))}
    </div>
  );
};

export default TablerLoader;
