# CLAUDE.md

I'll systematically explore the repository to gather all the information needed for a comprehensive CLAUDE.md file.Now let me read all the key files in parallel:Now I have everything I need. Let me generate the comprehensive CLAUDE.md:

---

# CLAUDE.md

## Project Overview

**TeamBoard** is an internal team directory application for managing team member profiles, departments, and HR reporting. It is a full-stack TypeScript monorepo with an Express/SQLite backend and a React/Vite frontend.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js >= **22.5.0** (required for built-in `node:sqlite`) |
| Server | Express 4, TypeScript 5, `node:sqlite` (`DatabaseSync`) |
| Client | React 19, Vite 6, plain CSS |
| Package manager | **pnpm** |

## Common Commands

```bash
pnpm install          # Install all dependencies
pnpm build            # Compile server TypeScript → dist/server/
pnpm dev              # Run server + client concurrently (requires build first)
pnpm typecheck        # Type-check both server and client (no emit)
pnpm start            # Run compiled server only (production)
```

> **Important:** `pnpm build` must be run before `pnpm dev` because `dev:server` runs `node --watch dist/server/index.js` — it does **not** use `ts-node` or `tsx`.

**Ports:**
- Server: `http://localhost:4060` (override via `PORT` env var)
- Client (Vite dev): `http://localhost:5173` — proxies `/api` to `:4060`

## Project Structure

```
teamboard/
├── package.json              — Root package (type: "module"), all scripts
├── pnpm-lock.yaml
├── server/
│   ├── tsconfig.json         — TypeScript config for type-checking (with declarations)
│   ├── tsconfig.build.json   — Extends tsconfig.json, strips declarations/sourcemaps for build
│   └── src/
│       ├── index.ts          — Express app entry point
│       ├── db.ts             — SQLite singleton init + seed data
│       └── routes/
│           └── members.ts    — All member CRUD endpoints
├── client/
│   ├── index.html            — Vite HTML entry point
│   ├── tsconfig.json         — Client TypeScript config (bundler module resolution)
│   ├── vite.config.ts        — Vite config with /api proxy
│   └── src/
│       ├── main.tsx          — React entry (createRoot + StrictMode)
│       ├── App.tsx           — Single-component UI (all state + fetch logic here)
│       └── styles.css        — Plain CSS (no CSS framework)
├── data/
│   ├── .gitkeep
│   └── team.db               — SQLite database (gitignored, auto-created on first run)
└── dist/                     — Compiled server output (gitignored)
    └── server/
```

## Architecture & Key Patterns

### Server

- **Singleton DB**: `getDb()` in `db.ts` lazily initializes a single `DatabaseSync` instance. `data/` directory is auto-created. The `members` table is seeded with 8 sample members only if empty.
- **Module imports**: Server uses `NodeNext` module resolution — all local imports must include the `.js` extension (e.g., `import { getDb } from '../db.js'`).
- **Route handlers** are explicitly typed as `(req: Request, res: Response): void`.
- **SQL**: Always use parameterized queries with `?` placeholders. Never use string concatenation for SQL.
- **Type assertions**: SQLite query results are typed via `as unknown as T` (e.g., `as unknown as MemberRow[]`) because `node:sqlite` returns untyped results.
- **PATCH pattern**: Uses `COALESCE(?, existing_column)` to allow partial updates — only provided fields are changed.
- **DELETE**: Soft-deletes (TM-101): sets `is_active = 0` and prepends `deactivated-` to the email (idempotent — only prefixed once). The row is retained in the database. Hard-deletes are no longer performed.
- **Error format**: `{ "error": string }` with appropriate HTTP status codes (400, 404, 409).

### Client

- **Single component**: All logic lives in `App.tsx` — `useState` for form fields, members list, stats, and UI visibility.
- **Data fetching**: Plain `fetch()` — no external HTTP/data libraries.
- **API calls**: Use relative paths (e.g., `/api/members`) — Vite proxies to the server during dev.
- **Styling**: Plain CSS in `styles.css` — no Tailwind, no CSS-in-JS, no component library.

### Middleware

Two Express middleware functions are applied to all `/api/members*` routes (in order):

#### `requireAuth` (`server/src/middleware/auth.ts`)

Lenient authentication middleware backed by `@okta/jwt-verifier`.

| Condition | Behaviour |
|-----------|-----------|
| No `Authorization` header | Sets `req.user = { email: 'anonymous', workspaces: ['parent'] }` and calls `next()` — backward-compatible path for Looker dashboards and BambooHR exporters |
| `Authorization: Bearer <token>` present and **valid** | Extracts `email` and `groups` claims; filters `tb-workspace-*` groups to build `user.workspaces`; attaches to `req.user`; calls `next()` |
| `Authorization: Bearer <token>` present but **invalid** | Returns `401 { "error": "Unauthorized" }` |

Reads `OKTA_ISSUER` and `OKTA_CLIENT_ID` from `process.env`.

#### `resolveWorkspace` (`server/src/middleware/workspace.ts`)

Resolves the workspace context from the request.

1. Reads the `X-Workspace-Id` request header; defaults to `'parent'` when absent.
2. Looks up the workspace row by `slug` — returns `400 { "error": "Unknown workspace" }` if not found.
3. Checks that `req.user.workspaces` includes the slug — returns `403 { "error": "Forbidden" }` if not.
4. Attaches the full `WorkspaceRow` to `req.workspace` and calls `next()`.

> The one-quarter backward-compatibility window means that clients omitting `X-Workspace-Id` transparently receive Parent Co data. See ROLLOUT.md for the cutover timeline.

## Database Schema

```sql
CREATE TABLE workspaces (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  slug                   TEXT    NOT NULL UNIQUE,   -- e.g. 'parent', 'brightline'
  name                   TEXT    NOT NULL,
  bamboohr_dept_code_list TEXT   NOT NULL DEFAULT '[]', -- JSON array of valid dept codes
  okta_group             TEXT    NOT NULL DEFAULT ''    -- e.g. 'tb-workspace-brightline'
)

CREATE TABLE members (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT    NOT NULL,
  email        TEXT    NOT NULL UNIQUE,
  role         TEXT    NOT NULL,
  department   TEXT    NOT NULL,
  start_date   TEXT    NOT NULL,              -- ISO date string: YYYY-MM-DD
  is_active    INTEGER NOT NULL DEFAULT 1,    -- 1 = active, 0 = inactive
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  workspace_id INTEGER NOT NULL DEFAULT 1 REFERENCES workspaces(id)
)

CREATE TABLE departments (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id),
  code         TEXT    NOT NULL,
  name         TEXT    NOT NULL,
  UNIQUE(workspace_id, code)
)

CREATE TABLE audit_log (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_email  TEXT    NOT NULL,
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id),
  action       TEXT    NOT NULL,   -- e.g. 'member_create', 'member_update', 'member_delete', 'export_download'
  entity_id    INTEGER,            -- NULL for actions not tied to a single entity
  at           TEXT    NOT NULL DEFAULT (datetime('now'))
)

CREATE TABLE feature_flags (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL    -- string-encoded; 'true'/'false' for boolean flags
)
```

- The DB file lives at `data/team.db` relative to `process.cwd()` (project root).
- `updated_at` is updated manually in the PATCH handler (not via trigger).
- Note: seed data has inconsistent department names — some use `"Engineering"`, others `"Eng"`.
- `workspace_id` defaults to `1` (the "Parent Co" workspace) for backward compatibility.
- Migrations are applied automatically at server startup via `server/src/migrate.ts`.

> **Production note:** Run ROLLOUT.md procedures before enabling `workspace_switcher_enabled` in production.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/members` | List active members (`is_active = 1`), ordered by name; scoped to `X-Workspace-Id` |
| POST | `/api/members` | Create member; required: `name, email, role, department, start_date`; scoped to workspace |
| GET | `/api/members/:id` | Get single member by ID (includes inactive); scoped to workspace |
| PATCH | `/api/members/:id` | Partial update: `name, email, role, department`; scoped to workspace |
| DELETE | `/api/members/:id` | Soft-delete: sets `is_active = 0`, prepends `deactivated-` to email (TM-101); scoped to workspace |
| GET | `/api/members/export` | Download workspace-scoped members as CSV (`members.csv`); honours `?workspace=` query param |
| GET | `/api/members/stats` | Total active count + breakdown by department; scoped to workspace |
| POST | `/api/auth/signin` | Exchange Okta ID token for user profile + list of accessible `WorkspaceRow[]` objects |
| GET | `/api/feature-flags` | Return all feature flags as `{ flags: Record<string, string> }`; returns `{ flags: {} }` if table absent |
| PATCH | `/api/feature-flags/:key` | Update a single feature flag value; body: `{ value: string }` |

> **Route order matters:** `/export` and `/stats` are registered before `/:id` to prevent them from being captured as ID params.

## TypeScript Configuration

| Config | Target | Module | Resolution | JSX |
|---|---|---|---|---|
| `server/tsconfig.json` | ES2022 | NodeNext | NodeNext | — |
| `server/tsconfig.build.json` | ES2022 | NodeNext | NodeNext | — |
| `client/tsconfig.json` | ES2022 | ESNext | bundler | react-jsx |

- **Strict mode** is enabled on both server and client.
- `skipLibCheck: true` on both.
- Server emits to `dist/server/` (relative to project root, configured via `outDir: "../dist/server"`).

## Code Style Conventions

- TypeScript strict mode — no `any`, use interfaces for data shapes.
- ES module syntax everywhere (`import`/`export`), matching `"type": "module"` in `package.json`.
- Server local imports use `.js` extension even for `.ts` source files (NodeNext requirement).
- Client imports use `.js` extension for local modules (e.g., `import App from './App.js'`).
- Functions are declared with `function` keyword on the server; `async function` used for client fetch helpers.
- React components use function declarations; hooks at the top of the component.

## Dependencies

**Runtime:**
- `express` ^4.21 — HTTP server
- `cors` ^2.8 — CORS middleware

**Dev:**
- `typescript` ^5.7
- `vite` ^6.0 + `@vitejs/plugin-react` ^4.3
- `react` ^19 + `react-dom` ^19
- `concurrently` ^9.1 — runs server + client together in `pnpm dev`
- Type packages: `@types/express`, `@types/cors`, `@types/react`, `@types/react-dom`

**No external SQLite package** — uses Node.js built-in `node:sqlite` (requires Node >= 22.5).

## Environment & Setup Notes

- **Node >= 22.5.0** is a hard requirement for `node:sqlite`.
- No `.env` file is needed by default — the only env var is `PORT` (optional, defaults to `4060`).
- The `data/` directory and `team.db` are created automatically on first server start.
- There is **no test suite** and **no linter/formatter config** in this project.
- There is **no CI/CD pipeline** configured.
- The `data/team.db` file is gitignored (only `data/.gitkeep` is tracked).
- `dist/` is gitignored — always run `pnpm build` after cloning or after server changes before running `pnpm dev`.
