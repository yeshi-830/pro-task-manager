# pro-task-manager

Daymark Pro is a React task manager backed by a PostgreSQL database and a
Node.js/Express API. Accounts have private workspaces; workspace owners can add
other registered accounts as members.

## Run with Docker

1. Copy `.env.example` to `.env`.
2. Replace `JWT_SECRET` with a random value of at least 32 characters. For
   example, generate one with:

   ```sh
   node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
   ```

3. Run `docker compose up --build`.
4. Open <http://localhost:3000> and create an account.

Docker starts PostgreSQL and the production app. The named database volume
persists data when containers are restarted. `docker compose down` stops the
services; `docker compose down -v` also permanently removes the database
volume.

Change `POSTGRES_PASSWORD` in `.env` before first launch. If you also use the
local development server, update the password in `DATABASE_URL` to match.
Keep `.env` private and use separate strong database and JWT secrets in
production. Set `CLIENT_ORIGIN` to the exact public HTTPS origin(s) of the
frontend when deploying.

## Local development

Requirements: Node.js 22+ and Docker.

1. Copy `.env.example` to `.env` and set a strong `JWT_SECRET`.
2. Start only the database with `npm run db:up`.
3. Run `npm run dev` to start the API on port 3000 and Vite on port 5173.
4. Open <http://localhost:5173>.

The API applies the schema on startup. `npm run db:down` stops the local
database container without deleting its data.

## Backend

- `server/index.js` exposes the REST API and serves the production frontend.
- `server/schema.sql` defines users, isolated workspaces, membership roles,
  projects, and indexed tasks.
- `server/db.js` manages the PostgreSQL connection pool and schema
  initialization.
- Browser sessions use short-lived, HTTP-only, SameSite cookies; passwords are
  hashed with bcrypt. API requests are validated, rate-limited at
  authentication endpoints, and scoped to a workspace membership.
- Task lists are filtered and sorted by the API in pages of up to 100. The
  existing interface loads 50 at a time; workspace statistics are aggregated
  in the database.
- Workspace owners can add an existing Daymark account from the workspace
  header's member button. Members can work with that workspace's projects and
  tasks.

The API is rooted at `/api`. Useful routes include:

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Check API and database connectivity |
| `POST` | `/api/auth/register` | Create an account and private workspace |
| `POST` | `/api/auth/login` | Sign in |
| `GET` | `/api/auth/me` | Read the signed-in user and workspaces |
| `GET`, `POST` | `/api/workspaces` | List or create workspaces |
| `GET`, `POST` | `/api/workspaces/:id/members` | List or add workspace members |
| `GET`, `POST` | `/api/projects` | List or create projects in the active workspace |
| `GET`, `POST` | `/api/tasks` | List a page or create a task |
| `PATCH`, `DELETE` | `/api/tasks/:id` | Update or delete a task |
| `GET` | `/api/stats` | Read workspace-wide task counts |
| `GET`, `POST` | `/api/export`, `/api/import` | Back up or replace workspace data |

Task listing accepts `view`, `projectId`, `q`, `priority`, `sort`, `today`,
`limit`, and `offset` query parameters. The maximum page size is 100. The
`x-workspace-id` header selects a workspace and is checked against the
authenticated user's membership on every scoped request.