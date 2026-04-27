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
│       ├── index.ts          — Express app entry point (session, Okta, workspace middleware)
│       ├── db.ts             — SQLite singleton init + seed data + runMigrations call
│       ├── migrations/
│       │   └── 001_add_workspaces.ts  — Reversible migration: workspaces, departments, audit_log
│       ├── middleware/
│       │   ├── workspace.ts  — resolveWorkspace + requireWorkspaceAccess middleware
│       │   └── audit.ts      — writeAuditLog helper
│       ├── types/
│       │   └── express.d.ts  — Global Express Request augmentation (workspace, userWorkspaces, user)
│       └── routes/
│           ├── members.ts    — All member CRUD endpoints (workspace-scoped)
│           ├── workspaces.ts — GET /api/workspaces
│           └── auth.ts       — GET /api/user
├── client/
│   ├── index.html            — Vite HTML entry point
│   ├── tsconfig.json         — Client TypeScript config (bundler module resolution)
│   ├── vite.config.ts        — Vite config with /api proxy
│   └── src/
│       ├── main.tsx          — React entry (createRoot + StrictMode)
│       ├── App.tsx           — Single-component UI (workspace switcher, department filter)
│       └── styles.css        — Plain CSS (no CSS framework)
├── data/
│   ├── .gitkeep
│   └── team.db               — SQLite database (gitignored, auto-created on first run)
└── dist/                     — Compiled server output (gitignored)
    └── server/
```

## Architecture & Key Patterns

### Server

- **Singleton DB**: `getDb()` in `db.ts` lazily initializes a single `DatabaseSync` instance. `data/` directory is auto-created. Migrations run automatically on every startup (idempotent). The `members` table is seeded with 8 sample members (scoped to `parent-co` workspace) only if empty.
- **Module imports**: Server uses `NodeNext` module resolution — all local imports must include the `.js` extension (e.g., `import { getDb } from '../db.js'`).
- **Route handlers** are explicitly typed as `(req: Request, res: Response): void`.
- **SQL**: Always use parameterized queries with `?` placeholders. Never use string concatenation for SQL.
- **Type assertions**: SQLite query results are typed via `as unknown as T` (e.g., `as unknown as MemberRow[]`) because `node:sqlite` returns untyped results.
- **PATCH pattern**: Uses `COALESCE(?, existing_column)` to allow partial updates — only provided fields are changed.
- **DELETE**: Soft-delete via `UPDATE` — sets `is_active = 0` and prepends `deactivated-` to the email (guarded against double-prefix). Hard removal is not used.
- **Error format**: `{ "error": string }` with appropriate HTTP status codes (400, 403, 404, 409).
- **Workspace scoping**: Every data-fetching query includes `AND workspace_id = ?` bound to `req.workspace.id` resolved by the `resolveWorkspace` middleware.

### Client

- **Single component**: All logic lives in `App.tsx` — `useState` for form fields, members list, stats, and UI visibility.
- **Data fetching**: Plain `fetch()` — no external HTTP/data libraries.
- **API calls**: Use relative paths (e.g., `/api/members`) — Vite proxies to the server during dev.
- **Styling**: Plain CSS in `styles.css` — no Tailwind, no CSS-in-JS, no component library.

## Database Schema

All schema changes are managed via versioned migrations in `server/src/migrations/`. Migrations run automatically on server startup inside `getDb()`.

### workspaces

```sql
CREATE TABLE workspaces (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  slug                    TEXT    NOT NULL UNIQUE,            -- URL-safe identifier, e.g. "parent-co"
  name                    TEXT    NOT NULL,                   -- Display name, e.g. "Parent Co"
  bamboohr_dept_code_list TEXT,                              -- JSON array of valid dept codes, or NULL
  bamboohr_api_key        TEXT,                              -- Per-workspace BambooHR API key, or NULL
  okta_group              TEXT                               -- Okta group slug, e.g. "tb-workspace-parent-co"
)
```

### departments

```sql
CREATE TABLE departments (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id),  -- FK: which workspace owns this dept
  name         TEXT    NOT NULL
)
```

### members

```sql
CREATE TABLE members (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id),  -- FK: isolates member to one workspace
  name         TEXT    NOT NULL,
  email        TEXT    NOT NULL,
  role         TEXT    NOT NULL,
  department   TEXT    NOT NULL,
  start_date   TEXT    NOT NULL,                            -- ISO date string: YYYY-MM-DD
  is_active    INTEGER NOT NULL DEFAULT 1,                  -- 1 = active, 0 = inactive (soft-delete)
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (email, workspace_id)                              -- email unique per workspace, not globally
)
```

### audit_log

```sql
CREATE TABLE audit_log (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_email  TEXT    NOT NULL,                            -- Who performed the action ("system" when auth is off)
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id),  -- FK: which workspace the action occurred in
  action       TEXT    NOT NULL,                            -- e.g. "member.create", "member.export"
  entity_id    TEXT,                                        -- ID of the affected entity, or NULL
  at           TEXT    NOT NULL DEFAULT (datetime('now'))   -- UTC timestamp
)
```

**Notes:**

- The DB file lives at `data/team.db` relative to `process.cwd()` (project root).
- `updated_at` on `members` is set manually in the PATCH handler (not via trigger).
- The `001_add_workspaces` migration corrects historical department name inconsistencies (`"Eng"` → `"Engineering"`, `"Human Resources"` → `"HR"`).
- `PRAGMA foreign_keys = ON` and `PRAGMA journal_mode = WAL` are set on every connection open.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/members` | List active members (`is_active = 1`) for the resolved workspace, ordered by name; accepts optional `?department=X` filter |
| POST | `/api/members` | Create member in the resolved workspace; required: `name, email, role, department, start_date`; validates `department` against workspace's `bamboohr_dept_code_list` |
| GET | `/api/members/:id` | Get single member by ID, scoped to the resolved workspace (includes inactive) |
| PATCH | `/api/members/:id` | Partial update (`name, email, role, department`), scoped to the resolved workspace |
| DELETE | `/api/members/:id` | Soft-delete: sets `is_active = 0`, prepends `deactivated-` to email (idempotent) |
| GET | `/api/members/export` | Download workspace-scoped CSV (`members.csv`); accepts `?workspace=X` to override the `X-Workspace-Id` header |
| GET | `/api/members/stats` | Total active count + breakdown by department, scoped to the resolved workspace |
| GET | `/api/workspaces` | List workspaces the current user can access; returns `{ workspaces: [{ id, slug, name }] }` |
| GET | `/api/user` | Return `{ email, accessible_workspaces: [{ slug, name }], workspace_switcher_enabled }` for the authenticated user |

> **Route order matters:** `/export` and `/stats` are registered before `/:id` to prevent them from being captured as ID params.

### X-Workspace-Id Header

All `/api/*` routes resolve the active workspace from the `X-Workspace-Id` request header. The value must be a valid workspace **slug** (e.g. `parent-co`, `brightline`).

| Scenario | Behaviour |
|----------|-----------|
| Header present, slug found | Request proceeds scoped to that workspace |
| Header absent or slug not found — `WORKSPACE_COMPAT_FALLBACK` ≠ `false` | Falls back silently to the `parent-co` workspace (one-quarter backwards-compat window) |
| Header absent or slug not found — `WORKSPACE_COMPAT_FALLBACK=false` | Returns `404 { "error": "Workspace not found" }` — no fallback |

**Cutover procedure:** Set `WORKSPACE_COMPAT_FALLBACK=false` only after all consumers (Looker dashboards, BambooHR exporter, public directory page) have been updated to send `X-Workspace-Id`. Until then, the absence of the header is silently tolerated and defaults to `parent-co`.

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

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP port the server listens on | `4060` |
| `SESSION_SECRET` | Secret used to sign the express-session cookie | *(required in production)* |
| `OKTA_AUTH_ENABLED` | Set to `true` to enable Okta OIDC authentication; when `false` all auth middleware is bypassed and all workspace slugs are granted | `false` |
| `OKTA_ISSUER` | Okta issuer URL (e.g. `https://dev-xxx.okta.com/oauth2/default`) | — |
| `OKTA_CLIENT_ID` | OIDC client ID registered in Okta | — |
| `OKTA_CLIENT_SECRET` | OIDC client secret registered in Okta | — |
| `APP_BASE_URL` | Public base URL of the app, used by Okta to build the redirect URI (e.g. `https://teamboard.example.com`) | — |
| `WORKSPACE_COMPAT_FALLBACK` | Controls the backwards-compat fallback for missing `X-Workspace-Id`. When absent or any value other than `false`, requests without a valid workspace slug silently default to `parent-co`. Set to `false` to disable the fallback and return `404` instead (cutover mode). | *(not set — fallback enabled)* |
| `WORKSPACE_SWITCHER_ENABLED` | Set to `true` to render the workspace switcher dropdown in the UI. Exposed to the client via `GET /api/user`. | `false` |

> Variables `OKTA_ISSUER`, `OKTA_CLIENT_ID`, `OKTA_CLIENT_SECRET`, and `APP_BASE_URL` are only read when `OKTA_AUTH_ENABLED=true`.

## Environment & Setup Notes

- **Node >= 22.5.0** is a hard requirement for `node:sqlite`.
- The `data/` directory and `team.db` are created automatically on first server start. Migrations run automatically inside `getDb()`.
- There is **no test suite** and **no linter/formatter config** in this project.
- There is **no CI/CD pipeline** configured.
- The `data/team.db` file is gitignored (only `data/.gitkeep` is tracked).
- `dist/` is gitignored — always run `pnpm build` after cloning or after server changes before running `pnpm dev`.

## Migrations

Database migrations are versioned TypeScript files under `server/src/migrations/`. They are **automatically executed on every server startup** inside `getDb()` — no manual CLI step required.

### How it works

1. `getDb()` imports `runMigrations` from `./migrations/001_add_workspaces.js` and calls it after opening the database.
2. `runMigrations(db)` ensures a `_migrations` table exists (`name TEXT PRIMARY KEY`) and uses `INSERT OR IGNORE` to record each migration name. A migration whose name is already in `_migrations` is skipped, making every call idempotent.

### 001_add_workspaces.ts

| Export | Purpose |
|--------|---------|
| `up(db)` | Creates `workspaces`, `departments`, `members` (with `workspace_id`), `audit_log`; inserts seed data for the Parent Co workspace; corrects legacy dept name typos. Wrapped in a single `db.transaction()()` for atomicity. |
| `down(db)` | Reverses `up`: recreates the original `members` table (without `workspace_id`), drops `audit_log`, `departments`, and `workspaces`. Also wrapped in `db.transaction()()`. |
| `runMigrations(db)` | Creates `_migrations` if absent; calls `up` exactly once per database using `INSERT OR IGNORE` gating. |

### Adding a new migration

1. Create `server/src/migrations/002_<description>.ts` exporting `up(db)`, `down(db)`, and `runMigrations(db)`.
2. Import and call it from `getDb()` in `db.ts` immediately after the existing `runMigrations` call.
3. Always wrap both `up` and `down` in `db.transaction()()` so failures leave the schema in a consistent state.

## Process Gates

The following approvals are **mandatory before the associated PR merges**. They are not optional quality steps — they are blocking gates.

| Gate | Who must approve | Applies to |
|------|-----------------|------------|
| **People Ops review** | People Operations team | Any PR that touches the `members` table schema (columns, constraints, indexes, backfill queries) |
| **BambooHR sandbox run** | HR Engineering / BambooHR integration owner | Any PR that changes `GET /api/members/export` output — including column order, header names, filtering logic, or workspace scoping |
| **Compliance sign-off** | Compliance / Security team | Any PR that touches the `audit_log` table schema (column additions, removals, type changes) or the `writeAuditLog` helper |

> Rationale: employee data changes require People Ops oversight for data-governance compliance; the BambooHR exporter is a Monday batch job with no rollback — bad columns break HR uploads; the audit log is SOC 2 evidence and schema changes must be pre-approved by Compliance.
