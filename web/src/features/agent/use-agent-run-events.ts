import { useEffect, useState } from "react";
import { env } from "@/config/env";
import type { AgentRunEvent, AgentStatus } from "./agentrun.types";

interface UseAgentRunEventOptions {
  agentRunId: string;
  initialStatus: AgentStatus;
  initialStartedAt?: string | null;
  initialCompletedAt?: string | null;
  initialCurrentStep?: string | null;
  enabled: boolean;
}

export function useAgentRunEvents({
  agentRunId,
  initialStatus,
  initialStartedAt,
  initialCompletedAt,
  initialCurrentStep,
  enabled,
}: UseAgentRunEventOptions) {
  const [status, setStatus] = useState(initialStatus);
  const [currentStep, setCurrentStep] = useState(
    initialCurrentStep ?? "Starting run...",
  );
  const [startedAt, setStartedAt] = useState<string | null>(
    initialStartedAt ?? null,
  );
  const [completedAt, setCompletedAt] = useState<string | null>(
    initialCompletedAt ?? null,
  );
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<AgentRunEvent[]>([]);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!startedAt || ["COMPLETED", "FAILED", "CANCELLED"].includes(status)) {
      if (startedAt && completedAt) {
        const elapsed =
          new Date(completedAt).getTime() - new Date(startedAt).getTime();
        setDuration(Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0);
      }
      return;
    }
    const updateDuration = () => {
      const elapsed = Date.now() - new Date(startedAt).getTime();
      setDuration(Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0);
    };
    updateDuration();
    const interval = window.setInterval(updateDuration, 1000);
    return () => window.clearInterval(interval);
  }, [startedAt, completedAt, status]);

  useEffect(() => {
    if (!enabled || !agentRunId) return;

    const url = new URL(
      `${env.VITE_API_BASE_URL}/agent/runs/${encodeURIComponent(agentRunId)}/events`,
      window.location.origin,
    );
    const source = new EventSource(url, { withCredentials: true });
    const handleEvent = (message: MessageEvent<string>) => {
      const event = JSON.parse(message.data) as AgentRunEvent;
      setEvents((previous) =>
        previous.some((item) => item.id === event.id)
          ? previous
          : [...previous, event],
      );
      setStatus(event.status);
      setCurrentStep(event.currentRunStep ?? "");
      setStartedAt(event.startedAt);
      setCompletedAt(event.completedAt);
      if (event.response !== null) setResponse(event.response);
      if (event.error !== null) setError(event.error);
      if (["COMPLETED", "FAILED", "CANCELLED"].includes(event.status)) {
        source.close();
      }
    };
    source.addEventListener("run", handleEvent as EventListener);

    return () => {
      source.removeEventListener("run", handleEvent as EventListener);
      source.close();
    };
  }, [agentRunId, enabled]);

  return {
    status,
    currentStep,
    startedAt,
    completedAt,
    response,
    error,
    events,
    duration,
  };
}
