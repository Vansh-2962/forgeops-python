import { axiosInstance } from "@/config/axios";
import type {
  DeclareIncidentRequest,
  IncidentRecord,
  IncidentStatus,
} from "@/features/incidents/incident.types";

export const getIncidents = async () => {
  const response = await axiosInstance.get<{ incidents: IncidentRecord[] }>(
    "/incidents",
  );
  return response.data;
};

export const declareIncident = async (incident: DeclareIncidentRequest) => {
  const response = await axiosInstance.post<IncidentRecord>(
    "/incidents",
    incident,
  );
  return response.data;
};

export const investigateIncident = async (incidentId: string) => {
  const response = await axiosInstance.post<IncidentRecord>(
    `/incidents/${encodeURIComponent(incidentId)}/investigate`,
  );
  return response.data;
};

export const updateIncidentStatus = async (
  incidentId: string,
  status: IncidentStatus,
) => {
  const response = await axiosInstance.patch<IncidentRecord>(
    `/incidents/${encodeURIComponent(incidentId)}`,
    { status },
  );
  return response.data;
};
