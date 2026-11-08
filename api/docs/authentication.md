# FastAPI authentication

The API owns user accounts and opaque server-side sessions. Session tokens are
random, stored as keyed SHA-256 digests in PostgreSQL, and delivered only in an
`HttpOnly` cookie. Passwords are hashed with Argon2id. The frontend must not
read, store, or send a session token itself.

## Endpoints

- `POST /auth/register` accepts `email`, `password` (at least 12 characters),
  and `name`. It creates the account and signs the user in.
- `POST /auth/login` accepts `email` and `password`.
- `GET /auth/session` returns the signed-in user or `user: null`.
- `POST /auth/logout` revokes the current session and clears the cookie.
- `GET /auth/google?return_to=/dashboard` starts Google OpenID Connect.
  The callback is `GET /auth/google/callback`.

GitHub repository and agent-run endpoints require the session cookie. Agent
runs belong to their creating user; run list/detail, controls, and SSE replay
are scoped to that user.

## Configuration

Set `BETTER_AUTH_SECRET` to a private random value with at least 32 characters.
Despite its legacy name, this secret is used by the FastAPI session and OAuth
implementation; it must only exist on the API server.

Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and
`GOOGLE_CALLBACK_URL=http://localhost:8000/auth/google/callback`. Add that
callback URL to the authorized redirect URIs in Google Cloud Console.
`FRONTEND_URL` is the frontend origin used after OAuth, and
`FRONTEND_ORIGINS` is the comma-separated CORS allowlist. In production,
serve over HTTPS and set `SESSION_COOKIE_SECURE=true`.

In local development, Vite runs on port 5173 and proxies `/api` to FastAPI on
port 8000. The browser uses `/api` for both JSON requests and SSE.

## Scope and deployment

Email/password registration does not currently send verification or password
recovery emails. Do not represent either flow as enabled until a trusted email
delivery service and token-expiry flow have been configured.

Run the API with a single worker while run execution controls are held in
process memory. The database stores auth sessions and run ownership/history.
