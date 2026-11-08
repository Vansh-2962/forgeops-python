# Agent run event stream

Agent runs are persisted in PostgreSQL and their updates are exposed over
Server-Sent Events (SSE).
All run endpoints require a signed-in user and only expose that user's runs.
See [authentication.md](./authentication.md) for sign-in and cookie setup.

## Start and follow a run

Create a run:

```http
POST /agent/runs
Content-Type: application/json

{"message":"Inspect my repository and summarize its structure"}
```

The `202 Accepted` response contains `runId`, `runUrl`, and `eventsUrl`.
Connect an `EventSource` to `eventsUrl` to receive persisted events:

```javascript
const source = new EventSource(eventsUrl);
source.addEventListener("run", ({ data }) => {
  const event = JSON.parse(data);
  renderRun(event);
});
```

Each `run` SSE event has an integer SSE `id` and a JSON payload:

```json
{
  "id": 2,
  "runId": "a-run-uuid",
  "timestamp": "2026-10-04T15:00:00Z",
  "status": "RUNNING",
  "currentRunStep": "Reading repository files...",
  "response": null,
  "error": null,
  "startedAt": "2026-10-04T15:00:00Z",
  "completedAt": null,
  "details": {"tool": "read_repository_file"}
}
```

Supported statuses are `STARTED`, `RUNNING`, `FAILED`, `COMPLETED`, `PAUSED`,
and `CANCELLED`. `timestamp` is the event time; `startedAt` and `completedAt`
are run lifecycle timestamps. A terminal event includes the final `response`
or `error`.

SSE clients can reconnect with the standard `Last-Event-ID` header. For clients
that cannot set this header, use `GET /agent/runs/{runId}/events?after_id={id}`.
The stream ends after it has delivered all events for a terminal run. The
current persisted snapshot is available from `GET /agent/runs/{runId}`.

Runs can be paused, resumed, and cancelled with:

- `POST /agent/runs/{runId}/pause`
- `POST /agent/runs/{runId}/resume`
- `POST /agent/runs/{runId}/cancel`

Pausing takes effect at the next graph event boundary; it does not interrupt
an in-flight GitHub or model request.

## Database setup

Set `DATABASE_URL` to a PostgreSQL async URL, for example:

```text
postgresql+asyncpg://postgres:password@localhost:5432/forgeops
```

For a frontend on a different origin, set `FRONTEND_ORIGINS` to a
comma-separated allowlist, such as `http://localhost:5173`.

The application creates the run and event tables at startup. Keep this service
on one application worker: active tasks and pause/cancel controls are managed
in process memory, while run state and stream history are stored in PostgreSQL.
Run endpoints currently have no user-ownership authorization; protect them
behind the application's authentication layer before exposing private run
responses to multiple users. Treat run IDs as unguessable identifiers, not a
replacement for authentication.
