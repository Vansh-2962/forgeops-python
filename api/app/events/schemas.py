from datetime import datetime
from enum import StrEnum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic.alias_generators import to_camel


class RunStatus(StrEnum):
    STARTED = "STARTED"
    RUNNING = "RUNNING"
    FAILED = "FAILED"
    COMPLETED = "COMPLETED"
    PAUSED = "PAUSED"
    CANCELLED = "CANCELLED"


class RunEventResponse(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        from_attributes=True,
        populate_by_name=True,
    )

    id: int
    run_id: UUID
    timestamp: datetime
    status: RunStatus
    current_run_step: str | None
    response: str | None
    error: str | None
    started_at: datetime | None
    completed_at: datetime | None
    details: dict[str, Any] | None


class AgentRunResponse(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        from_attributes=True,
        populate_by_name=True,
    )

    id: UUID
    project_id: str | None
    project_name: str | None
    repository_full_name: str | None
    prompt: str | None
    status: RunStatus
    current_run_step: str | None
    response: str | None
    error: str | None
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime


class AgentRunListResponse(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        from_attributes=True,
        populate_by_name=True,
    )

    runs: list[AgentRunResponse]


class CreateRunResponse(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )

    run_id: UUID
    status: RunStatus
    events_url: str
    run_url: str


class AgentApprovalStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class AgentApprovalResponse(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        from_attributes=True,
        populate_by_name=True,
    )

    id: UUID
    run_id: UUID
    tool_name: str
    arguments: dict[str, Any]
    risk: str
    status: AgentApprovalStatus
    created_at: datetime
    decided_at: datetime | None


class ProjectRepositoryResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    full_name: str
    default_branch: str


class ProjectResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: str
    name: str
    repository: ProjectRepositoryResponse
    description: str | None
    environments: list[dict[str, str]]
    created_at: datetime


class ProjectListResponse(BaseModel):
    data: list[ProjectResponse]
    count: int


class IncidentSeverity(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class IncidentStatus(StrEnum):
    OPEN = "open"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"


class IncidentTimelineEntry(BaseModel):
    time: datetime
    event: str


class IncidentCreateRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    title: str = Field(min_length=3, max_length=240)
    service: str = Field(min_length=1, max_length=160)
    severity: IncidentSeverity
    description: str | None = Field(default=None, max_length=5000)
    project_id: str | None = Field(default=None, max_length=255)
    project_name: str | None = Field(default=None, max_length=160)
    repository_full_name: str | None = Field(default=None, max_length=255)

    @field_validator("title", "service", mode="before")
    @classmethod
    def strip_required_text(cls, value: object) -> object:
        return value.strip() if isinstance(value, str) else value

    @field_validator("description", mode="before")
    @classmethod
    def strip_description(cls, value: object) -> object:
        return value.strip() or None if isinstance(value, str) else value


class IncidentResponse(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        from_attributes=True,
        populate_by_name=True,
    )

    id: UUID
    project_id: str | None
    project_name: str | None
    repository_full_name: str | None
    title: str
    service: str
    description: str | None
    severity: IncidentSeverity
    status: IncidentStatus
    timeline: list[IncidentTimelineEntry]
    agent_run_id: UUID | None
    created_at: datetime
    updated_at: datetime


class IncidentListResponse(BaseModel):
    incidents: list[IncidentResponse]


class IncidentStatusRequest(BaseModel):
    status: IncidentStatus


class DeploymentEnvironment(StrEnum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"


class DeploymentStatus(StrEnum):
    PENDING_APPROVAL = "pending_approval"
    QUEUED = "queued"
    IN_PROGRESS = "in_progress"
    SUCCESSFUL = "successful"
    FAILED = "failed"
    CANCELLED = "cancelled"


class DeploymentCreateRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    project_id: str = Field(min_length=1, max_length=255)
    workflow_file: str = Field(default="forgeops-deploy.yml", min_length=1, max_length=120)
    ref: str = Field(min_length=1, max_length=255)
    version: str = Field(min_length=1, max_length=160)
    environment: DeploymentEnvironment

    @field_validator("project_id", "workflow_file", "ref", "version", mode="before")
    @classmethod
    def strip_deployment_text(cls, value: object) -> object:
        return value.strip() if isinstance(value, str) else value

    @field_validator("workflow_file")
    @classmethod
    def validate_workflow_file(cls, value: str) -> str:
        if (
            "/" in value
            or "\\" in value
            or not value.endswith((".yml", ".yaml"))
            or value in {".yml", ".yaml"}
        ):
            raise ValueError("Workflow must be a .yml or .yaml file in the workflows directory")
        return value


class DeploymentResponse(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        from_attributes=True,
        populate_by_name=True,
    )

    id: UUID
    project_id: str
    project_name: str
    repository_full_name: str
    deployed_by: str
    workflow_file: str
    ref: str
    version: str
    environment: DeploymentEnvironment
    status: DeploymentStatus
    github_run_id: int | None
    github_run_url: str | None
    error: str | None
    approved_at: datetime | None
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime


class DeploymentListResponse(BaseModel):
    deployments: list[DeploymentResponse]
