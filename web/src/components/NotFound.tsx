import { FileQuestion, RefreshCw } from "lucide-react";

interface NotFoundProps {
  resource: string;
  description?: string;
  onRetry?: () => void;
}

const NotFound = ({ resource, description, onRetry }: NotFoundProps) => {
  return (
    <div className="flex min-h-75 mt-5 w-full flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 py-12 text-center">
      <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-muted">
        <FileQuestion className="size-8 text-muted-foreground" />
      </div>

      <h2 className="text-xl font-semibold tracking-tight">
        No {resource} found
      </h2>

      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description ??
          `We couldn't find any ${resource.toLowerCase()} at the moment.`}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-6 inline-flex items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          <RefreshCw className="size-4" />
          Try again
        </button>
      )}
    </div>
  );
};

export default NotFound;
