import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Bot, ExternalLink, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { declareIncident, getIncidents, investigateIncident, updateIncidentStatus } from "@/api/incidents";
import { getAllProjects } from "@/api/project";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/PageHeader";
import { RiskBadge } from "@/components/shared/StatusBadge";
import { Textarea } from "@/components/ui/textarea";
import type { ProjectType } from "@/types/project";
import type {
  DeclareIncidentRequest,
  IncidentRecord,
  IncidentSeverity,
  IncidentStatus,
} from "@/features/incidents/incident.types";
import { cn } from "@/lib/utils";

const severityOptions: IncidentSeverity[] = [
  "low",
  "medium",
  "high",
  "critical",
];

const statusLabel: Record<IncidentStatus, string> = {
  open: "Open",
  investigating: "Investigating",
  resolved: "Resolved",
};

export default function Incidents() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const incidentsQuery = useQuery({
    queryKey: ["incidents"],
    queryFn: getIncidents,
  });
  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: getAllProjects,
  });
  const incidents = incidentsQuery.data?.incidents ?? [];
  const active = incidents.find((incident) => incident.id === selectedId);

  useEffect(() => {
    if (!selectedId && incidents.length > 0) {
      setSelectedId(incidents[0].id);
    } else if (selectedId && !incidents.some((item) => item.id === selectedId)) {
      setSelectedId(incidents[0]?.id ?? null);
    }
  }, [incidents, selectedId]);

  const refreshIncidents = () =>
    queryClient.invalidateQueries({ queryKey: ["incidents"] });
  const declareMutation = useMutation({
    mutationFn: declareIncident,
    onSuccess: async (incident) => {
      await refreshIncidents();
      setSelectedId(incident.id);
      setDialogOpen(false);
    },
  });
  const investigateMutation = useMutation({
    mutationFn: investigateIncident,
    onSuccess: async (incident) => {
      await refreshIncidents();
      setSelectedId(incident.id);
    },
  });
  const statusMutation = useMutation({
    mutationFn: ({
      incidentId,
      status,
    }: {
      incidentId: string;
      status: IncidentStatus;
    }) => updateIncidentStatus(incidentId, status),
    onSuccess: async (incident) => {
      await refreshIncidents();
      setSelectedId(incident.id);
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Incidents"
        description="Declare incidents, track response activity, and launch an evidence-oriented agent investigation."
        actions={
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4" /> Declare incident
          </Button>
        }
      />

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="space-y-2" aria-label="Incident list">
          {incidentsQuery.isLoading ? (
            <p className="rounded-lg border border-border p-6 text-sm text-muted-foreground">
              Loading incidents…
            </p>
          ) : incidentsQuery.isError ? (
            <p role="alert" className="rounded-lg border border-border p-6 text-sm text-destructive">
              Could not load incidents. Refresh and try again.
            </p>
          ) : incidents.length > 0 ? (
            incidents.map((incident) => (
              <button
                key={incident.id}
                onClick={() => setSelectedId(incident.id)}
                className={cn(
                  "w-full rounded-lg border bg-card p-4 text-left transition-colors",
                  selectedId === incident.id
                    ? "border-foreground/30"
                    : "border-border hover:border-foreground/20",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <RiskBadge level={incident.severity} />
                    <p className="mt-2 text-sm font-medium">{incident.title}</p>
                    <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                      {incident.projectName
                        ? `${incident.projectName} · `
                        : ""}
                      {incident.service}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(incident.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium">
                    {statusLabel[incident.status]}
                  </span>
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <AlertTriangle className="mx-auto h-5 w-5 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">No incidents declared</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Declare an incident to begin tracking its response.
              </p>
              <Button
                size="sm"
                className="mt-4 gap-1.5"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-4 w-4" /> Declare incident
              </Button>
            </div>
          )}
        </section>

        <section aria-label="Incident details">
          {active ? (
            <IncidentDetails
              incident={active}
              investigationPending={investigateMutation.isPending}
              statusPending={statusMutation.isPending}
              actionError={
                investigateMutation.isError || statusMutation.isError
                  ? "Could not update this incident. Refresh and try again."
                  : null
              }
              onInvestigate={() => investigateMutation.mutate(active.id)}
              onStatusChange={(status) =>
                statusMutation.mutate({ incidentId: active.id, status })
              }
            />
          ) : incidentsQuery.isLoading ? null : (
            <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Select an incident to view its details, or declare a new incident.
            </div>
          )}
        </section>
      </div>

      <DeclareIncidentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projects={projectsQuery.data?.data ?? []}
        projectsError={projectsQuery.isError}
        isPending={declareMutation.isPending}
        error={
          declareMutation.isError
            ? "Could not declare incident. Check the details and try again."
            : null
        }
        onSubmit={(payload) => declareMutation.mutate(payload)}
      />
    </div>
  );
}

function IncidentDetails({
  incident,
  investigationPending,
  statusPending,
  actionError,
  onInvestigate,
  onStatusChange,
}: {
  incident: IncidentRecord;
  investigationPending: boolean;
  statusPending: boolean;
  actionError: string | null;
  onInvestigate: () => void;
  onStatusChange: (status: IncidentStatus) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="font-mono text-xs text-muted-foreground">
        Incident #{incident.id.slice(0, 8)}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <h2 className="text-base font-semibold">{incident.title}</h2>
        <RiskBadge level={incident.severity} />
      </div>
      <p className="mt-1 font-mono text-xs text-muted-foreground">
        {incident.projectName ? `${incident.projectName} · ` : ""}
        {incident.service}
      </p>
      {incident.description && (
        <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
          {incident.description}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {incident.status !== "resolved" && (
          <Button
            size="sm"
            onClick={onInvestigate}
            disabled={investigationPending}
            className="gap-1.5"
          >
            <Bot className="h-4 w-4" />
            {investigationPending
              ? "Starting investigation…"
              : incident.agentRunId
                ? "Run investigation again"
                : "Investigate with agent"}
          </Button>
        )}
        {incident.agentRunId && (
          <Button asChild size="sm" variant="outline" className="gap-1.5">
            <Link to={`/runs/${incident.agentRunId}`}>
              View agent run <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Button>
        )}
        {incident.status !== "resolved" ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onStatusChange("resolved")}
            disabled={statusPending}
          >
            Resolve incident
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onStatusChange("open")}
            disabled={statusPending}
          >
            Reopen incident
          </Button>
        )}
      </div>
      {actionError && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {actionError}
        </p>
      )}

      <div className="mt-5 border-t border-border pt-5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Timeline
        </h3>
        {incident.timeline.length > 0 ? (
          <ol className="space-y-0">
            {incident.timeline.map((entry, index) => (
              <li
                key={`${entry.time}-${index}`}
                className="relative flex gap-3 pb-3 last:pb-0"
              >
                {index < incident.timeline.length - 1 && (
                  <span className="absolute left-[7px] top-4 h-[calc(100%-8px)] w-px bg-border" />
                )}
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-foreground" />
                <div>
                  <p className="font-mono text-xs text-muted-foreground">
                    {new Date(entry.time).toLocaleString()}
                  </p>
                  <p className="text-sm">{entry.event}</p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">No activity recorded.</p>
        )}
      </div>

      <div className="mt-5 rounded-md border border-border bg-muted/30 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          AI Investigation
        </h3>
        {incident.agentRunId ? (
          <div className="mt-2">
            <p className="text-sm text-muted-foreground">
              Investigation progress and evidence are available in the linked
              live agent run.
            </p>
            <Link
              to={`/runs/${incident.agentRunId}`}
              className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Open investigation <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            No AI investigation has been started. The agent will inspect the
            associated repository when available and recommend next steps; it
            will not apply remediation.
          </p>
        )}
      </div>
    </div>
  );
}

function DeclareIncidentDialog({
  open,
  onOpenChange,
  projects,
  projectsError,
  isPending,
  error,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: ProjectType[];
  projectsError: boolean;
  isPending: boolean;
  error: string | null;
  onSubmit: (payload: DeclareIncidentRequest) => void;
}) {
  const [title, setTitle] = useState("");
  const [service, setService] = useState("");
  const [severity, setSeverity] = useState<IncidentSeverity>("medium");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const selectedProject = projects.find((project) => project.id === projectId);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({
      title: title.trim(),
      service: service.trim() || selectedProject?.name || "",
      severity,
      description: description.trim() || undefined,
      ...(selectedProject
        ? {
            projectId: selectedProject.id,
            projectName: selectedProject.name,
            repositoryFullName: selectedProject.repository.fullName,
          }
        : {}),
    });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !isPending) {
      setTitle("");
      setService("");
      setSeverity("medium");
      setDescription("");
      setProjectId("");
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Declare an incident</DialogTitle>
          <DialogDescription>
            Record an observed issue. Incidents are not automatically detected
            until a monitoring source is connected.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Incident title</span>
            <Input
              required
              minLength={3}
              maxLength={240}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Elevated API latency"
            />
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Service</span>
              <Input
                required={!selectedProject}
                maxLength={160}
                value={service}
                onChange={(event) => setService(event.target.value)}
                placeholder={selectedProject?.name ?? "e.g. payments-api"}
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Severity</span>
              <select
                value={severity}
                onChange={(event) =>
                  setSeverity(event.target.value as IncidentSeverity)
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {severityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option[0].toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Project (optional)</span>
            <select
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">No project selected</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} — {project.repository.fullName}
                </option>
              ))}
            </select>
            {projectsError && (
              <span className="block text-xs text-destructive">
                Could not load projects. You can still declare this incident
                without linking a project.
              </span>
            )}
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Observed details (optional)</span>
            <Textarea
              maxLength={5000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What happened? Include symptoms, impact, and any evidence already collected."
              className="min-h-24 resize-y"
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !title.trim()}>
              {isPending ? "Declaring…" : "Declare incident"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
