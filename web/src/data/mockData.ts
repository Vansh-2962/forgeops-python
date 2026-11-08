import type {
  AgentRun,
  Project,
  Incident,
  Deployment,
  ActivityItem,
  InfrastructureService,
} from "@/types";

export const agentRuns: AgentRun[] = [
  {
    id: "run-001",
    task: "Deploy production API",
    project: "production-api",
    status: "running",
    currentStep: "Provisioning infrastructure",
    duration: "2m 14s",
    startedAt: "Just now",
    steps: [
      {
        id: "s1",
        label: "Task initialized",
        status: "done",
        timestamp: "2:41:03 PM",
      },
      {
        id: "s2",
        label: "Repository connected",
        detail: "GitHub / production-api",
        status: "done",
        timestamp: "2:41:10 PM",
      },
      {
        id: "s3",
        label: "Repository analyzed",
        detail: "Detected Node.js + PostgreSQL",
        status: "done",
        timestamp: "2:41:48 PM",
      },
      {
        id: "s4",
        label: "Docker configuration inspected",
        status: "done",
        timestamp: "2:42:05 PM",
      },
      {
        id: "s5",
        label: "Generating Dockerfile",
        detail: "Agent is currently working...",
        status: "running",
      },
      { id: "s6", label: "Build Docker image", status: "pending" },
      { id: "s7", label: "Run security scan", status: "pending" },
      { id: "s8", label: "Deploy to staging", status: "pending" },
      { id: "s9", label: "Verify deployment", status: "pending" },
    ],
    plan: [
      { id: "p1", label: "Analyze repository", status: "done" },
      { id: "p2", label: "Containerize application", status: "done" },
      { id: "p3", label: "Build image", status: "running" },
      { id: "p4", label: "Security scan", status: "pending" },
      { id: "p5", label: "Deploy", status: "pending" },
      { id: "p6", label: "Verify", status: "pending" },
    ],
    tools: ["GitHub", "Docker", "Filesystem", "Shell", "Kubernetes"],
    metrics: {
      model: "Claude / GPT",
      tokens: "18.4k",
      toolCalls: 27,
      duration: "2m 14s",
    },
    terminal: [
      "$ pnpm build",
      "",
      "> production-api@1.0.0 build",
      "> tsc",
      "",
      "✓ TypeScript compilation successful",
      "",
      "Process exited with code 0",
    ],
    toolCalls: [
      {
        id: "tc1",
        tool: "readFile",
        target: "package.json",
        status: "completed",
        summary:
          "Analyzing package.json to determine production build command.",
        detail: "Detected TypeScript production build.",
      },
      {
        id: "tc2",
        tool: "executeCommand",
        target: "pnpm build",
        status: "running",
        summary: "Running production build to verify container artifacts.",
      },
      {
        id: "tc3",
        tool: "readFile",
        target: "Dockerfile",
        status: "completed",
        summary:
          "Inspecting existing Docker configuration for optimization opportunities.",
        detail:
          "Found multi-stage build already present. Caching can be improved.",
      },
    ],
  },
  {
    id: "run-002",
    task: "Investigate API latency",
    project: "payments-service",
    status: "running",
    currentStep: "Inspecting application logs",
    duration: "48s",
    startedAt: "1 min ago",
    steps: [
      { id: "s1", label: "Task initialized", status: "done" },
      { id: "s2", label: "Metrics analyzed", status: "done" },
      { id: "s3", label: "Inspecting application logs", status: "running" },
      { id: "s4", label: "Identify root cause", status: "pending" },
    ],
    plan: [
      { id: "p1", label: "Collect metrics", status: "done" },
      { id: "p2", label: "Inspect logs", status: "running" },
      { id: "p3", label: "Identify root cause", status: "pending" },
      { id: "p4", label: "Recommend fix", status: "pending" },
    ],
    tools: ["Shell", "Logs", "Metrics", "Kubernetes"],
    metrics: {
      model: "Claude / GPT",
      tokens: "9.1k",
      toolCalls: 14,
      duration: "48s",
    },
    terminal: ["$ kubectl logs payments-service --tail=100"],
    toolCalls: [
      {
        id: "tc1",
        tool: "executeCommand",
        target: "kubectl logs payments-service",
        status: "running",
        summary:
          "Streaming recent application logs to locate latency anomalies.",
      },
    ],
  },
  {
    id: "run-003",
    task: "Generate Dockerfile",
    project: "analytics-api",
    status: "completed",
    currentStep: "Completed",
    duration: "4m 12s",
    startedAt: "12 min ago",
    steps: [
      { id: "s1", label: "Task initialized", status: "done" },
      { id: "s2", label: "Repository analyzed", status: "done" },
      { id: "s3", label: "Dockerfile generated", status: "done" },
      { id: "s4", label: "Build verified", status: "done" },
    ],
    plan: [
      { id: "p1", label: "Analyze repository", status: "done" },
      { id: "p2", label: "Generate Dockerfile", status: "done" },
      { id: "p3", label: "Verify build", status: "done" },
    ],
    tools: ["GitHub", "Docker", "Filesystem", "Shell"],
    metrics: {
      model: "Claude / GPT",
      tokens: "12.7k",
      toolCalls: 19,
      duration: "4m 12s",
    },
    terminal: [
      "$ docker build -t analytics-api:latest .",
      "✓ Build successful",
    ],
    toolCalls: [
      {
        id: "tc1",
        tool: "writeFile",
        target: "Dockerfile",
        status: "completed",
        summary: "Generated optimized multi-stage Dockerfile.",
      },
    ],
  },
  {
    id: "run-004",
    task: "Analyze production incident",
    project: "payments",
    status: "completed",
    currentStep: "Root cause identified",
    duration: "4m 32s",
    startedAt: "12 min ago",
    steps: [
      { id: "s1", label: "Incident context loaded", status: "done" },
      { id: "s2", label: "Logs correlated", status: "done" },
      { id: "s3", label: "Root cause identified", status: "done" },
    ],
    plan: [
      { id: "p1", label: "Correlate logs", status: "done" },
      { id: "p2", label: "Identify cause", status: "done" },
      { id: "p3", label: "Recommend action", status: "done" },
    ],
    tools: ["Logs", "Metrics", "Shell"],
    metrics: {
      model: "Claude / GPT",
      tokens: "15.2k",
      toolCalls: 22,
      duration: "4m 32s",
    },
    terminal: [],
    toolCalls: [],
  },
  {
    id: "run-005",
    task: "Review Kubernetes configuration",
    project: "production-api",
    status: "waiting_approval",
    currentStep: "Waiting for approval to apply changes",
    duration: "6m 01s",
    startedAt: "15 min ago",
    steps: [
      { id: "s1", label: "Configuration reviewed", status: "done" },
      { id: "s2", label: "Issues detected", status: "done" },
      { id: "s3", label: "Awaiting approval", status: "running" },
    ],
    plan: [
      { id: "p1", label: "Review config", status: "done" },
      { id: "p2", label: "Apply fixes", status: "running" },
    ],
    tools: ["Kubernetes", "Filesystem"],
    metrics: {
      model: "Claude / GPT",
      tokens: "8.3k",
      toolCalls: 11,
      duration: "6m 01s",
    },
    terminal: [],
    toolCalls: [],
  },
  {
    id: "run-006",
    task: "Plan deployment",
    project: "analytics-api",
    status: "failed",
    currentStep: "Build failed",
    duration: "2m 48s",
    startedAt: "34 min ago",
    steps: [
      { id: "s1", label: "Plan drafted", status: "done" },
      { id: "s2", label: "Build failed", status: "failed" },
    ],
    plan: [
      { id: "p1", label: "Draft plan", status: "done" },
      { id: "p2", label: "Build", status: "failed" },
    ],
    tools: ["Docker", "Shell"],
    metrics: {
      model: "Claude / GPT",
      tokens: "6.0k",
      toolCalls: 8,
      duration: "2m 48s",
    },
    terminal: ["✗ Build failed: exit code 1"],
    toolCalls: [],
  },
];

export const projects: Project[] = [
  {
    id: "production-api",
    name: "production-api",
    repoUrl: "github.com/vansh/production-api",
    stack: ["Node.js", "PostgreSQL", "Docker"],
    environment: "Production",
    health: "healthy",
    lastDeployment: "14 minutes ago",
    metrics: { cpu: 34, memory: 61, requests: "8,421", errorRate: "0.12%" },
    recentDeployments: [],
    recentRuns: [],
  },
  {
    id: "payments-service",
    name: "payments-service",
    repoUrl: "github.com/vansh/payments-service",
    stack: ["Go", "Redis", "gRPC"],
    environment: "Production",
    health: "degraded",
    lastDeployment: "1 hour ago",
    metrics: { cpu: 78, memory: 84, requests: "3,102", errorRate: "1.40%" },
    recentDeployments: [],
    recentRuns: [],
  },
  {
    id: "analytics-api",
    name: "analytics-api",
    repoUrl: "github.com/vansh/analytics-api",
    stack: ["Python", "ClickHouse", "Kafka"],
    environment: "Production",
    health: "healthy",
    lastDeployment: "8 minutes ago",
    metrics: { cpu: 41, memory: 52, requests: "12,540", errorRate: "0.05%" },
    recentDeployments: [],
    recentRuns: [],
  },
  {
    id: "web-frontend",
    name: "web-frontend",
    repoUrl: "github.com/vansh/web-frontend",
    stack: ["Next.js", "Vercel", "TypeScript"],
    environment: "Production",
    health: "healthy",
    lastDeployment: "2 hours ago",
    metrics: { cpu: 22, memory: 38, requests: "24,890", errorRate: "0.02%" },
    recentDeployments: [],
    recentRuns: [],
  },
];

export const incidents: Incident[] = [
  {
    id: "INC-1024",
    severity: "critical",
    title: "API latency increased by 420%",
    service: "payments-service",
    detectedAt: "14 minutes ago",
    status: "Investigating",
    timeline: [
      { time: "2:14 PM", event: "Latency spike detected" },
      { time: "2:15 PM", event: "Agent started investigation" },
      { time: "2:16 PM", event: "Redis connection pool analyzed" },
      { time: "2:18 PM", event: "Possible root cause identified" },
      { time: "2:20 PM", event: "Recommended rollback" },
    ],
    investigation: {
      confidence: 91,
      likelyCause: "Redis connection pool exhaustion",
      evidence: [
        "Connections: 98/100",
        "Latency increased after deployment",
        "Redis calls increased 3x",
      ],
    },
  },
  {
    id: "INC-1023",
    severity: "high",
    title: "Worker queue backlog growing",
    service: "analytics-api",
    detectedAt: "1 hour ago",
    status: "Resolved",
    timeline: [
      { time: "1:02 PM", event: "Backlog threshold exceeded" },
      { time: "1:10 PM", event: "Consumer autoscaled" },
      { time: "1:22 PM", event: "Backlog cleared" },
    ],
    investigation: {
      confidence: 86,
      likelyCause: "Insufficient consumer replicas for load",
      evidence: ["Queue depth: 14,200", "Consumers: 2", "Throughput flat"],
    },
  },
  {
    id: "INC-1022",
    severity: "medium",
    title: "Elevated 5xx rate on /checkout",
    service: "production-api",
    detectedAt: "3 hours ago",
    status: "Resolved",
    timeline: [
      { time: "11:30 AM", event: "Error rate above SLO" },
      { time: "11:45 AM", event: "Bad release rolled back" },
      { time: "11:50 AM", event: "Error rate normalized" },
    ],
    investigation: {
      confidence: 94,
      likelyCause: "Regression in v1.8.1 checkout handler",
      evidence: ["Errors began at v1.8.1 deploy", "Resolved after rollback"],
    },
  },
];

export const deployments: Deployment[] = [
  {
    id: "d1",
    version: "v1.8.2",
    environment: "Production",
    status: "successful",
    duration: "2m 31s",
    deployedBy: "ForgeOps Agent",
    time: "12 min ago",
    project: "analytics-api",
  },
  {
    id: "d2",
    version: "v1.4.0",
    environment: "Staging",
    status: "successful",
    duration: "1m 48s",
    deployedBy: "vansh",
    time: "34 min ago",
    project: "production-api",
  },
  {
    id: "d3",
    version: "v2.1.0",
    environment: "Production",
    status: "rolled_back",
    duration: "3m 02s",
    deployedBy: "ForgeOps Agent",
    time: "1 hour ago",
    project: "payments-service",
  },
  {
    id: "d4",
    version: "v0.9.4",
    environment: "Development",
    status: "failed",
    duration: "0m 54s",
    deployedBy: "ci-bot",
    time: "2 hours ago",
    project: "web-frontend",
  },
  {
    id: "d5",
    version: "v1.8.1",
    environment: "Production",
    status: "successful",
    duration: "2m 12s",
    deployedBy: "vansh",
    time: "3 hours ago",
    project: "production-api",
  },
  {
    id: "d6",
    version: "v1.8.0",
    environment: "Production",
    status: "in_progress",
    duration: "1m 09s",
    deployedBy: "ForgeOps Agent",
    time: "Just now",
    project: "production-api",
  },
];

export const activityFeed: ActivityItem[] = [
  {
    id: "a1",
    type: "success",
    title: "Deployment completed",
    description: "production-api deployed successfully",
    time: "2 minutes ago",
  },
  {
    id: "a2",
    type: "success",
    title: "Docker image built",
    description: "analytics-api:v1.8.2",
    time: "8 minutes ago",
  },
  {
    id: "a4",
    type: "success",
    title: "Incident resolved",
    description: "Redis connection pool exhaustion",
    time: "32 minutes ago",
  },
  {
    id: "a5",
    type: "info",
    title: "Agent task started",
    description: "Investigate API latency on payments-service",
    time: "1 hour ago",
  },
];

export const infrastructure: Record<string, InfrastructureService[]> = {
  Production: [
    { name: "API", status: "healthy" },
    { name: "Database", status: "healthy" },
    { name: "Redis", status: "healthy" },
    { name: "Workers", status: "healthy" },
    { name: "Kubernetes", status: "healthy" },
  ],
  Staging: [
    { name: "API", status: "healthy" },
    { name: "Database", status: "degraded" },
    { name: "Redis", status: "healthy" },
  ],
};

export const suggestedTasks = [
  "Analyze repository",
  "Create Dockerfile",
  "Investigate incident",
  "Review Kubernetes configuration",
  "Plan deployment",
  "Optimize infrastructure",
];

export const repositories = [
  "github.com/vansh/production-api",
  "github.com/vansh/payments-service",
  "github.com/vansh/analytics-api",
  "github.com/vansh/web-frontend",
];

export function getRun(id: string): AgentRun | undefined {
  return agentRuns.find((r) => r.id === id);
}

export function getProject(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}

export function getIncident(id: string): Incident | undefined {
  return incidents.find((i) => i.id === id);
}
