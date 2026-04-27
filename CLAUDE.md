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
- **DELETE**: Hard deletes (removes row). `is_active` flag exists but the DELETE endpoint removes the record entirely.
- **Error format**: `{ "error": string }` with appropriate HTTP status codes (400, 404, 409).

### Client

- **Single component**: All logic lives in `App.tsx` — `useState` for form fields, members list, stats, and UI visibility.
- **Data fetching**: Plain `fetch()` — no external HTTP/data libraries.
- **API calls**: Use relative paths (e.g., `/api/members`) — Vite proxies to the server during dev.
- **Styling**: Plain CSS in `styles.css` — no Tailwind, no CSS-in-JS, no component library.

## Database Schema

The DB file lives at `data/team.db` relative to `process.cwd()` (project root). All schema changes are applied via numbered migrations in `db.ts` (see `runMigrations()`).

### workspaces

```sql
CREATE TABLE workspaces (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  slug                    TEXT    NOT NULL UNIQUE,         -- URL-safe identifier, e.g. 'parent-co'
  name                    TEXT    NOT NULL,                -- Display name, e.g. 'Parent Co'
  bamboohr_dept_code_list TEXT    NOT NULL DEFAULT '[]',  -- JSON array of valid dept codes for this workspace
  okta_group              TEXT                            -- Okta group name, e.g. 'tb-workspace-parent-co'
)
```

Seeded workspaces: `parent-co` (Parent Co), `brightline` (Brightline), `northstar-logistics` (Northstar Logistics), `helio-studios` (Helio Studios).

### departments

```sql
CREATE TABLE departments (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id),
  name         TEXT    NOT NULL,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (workspace_id, name)
)
```

Parent Co department rows are seeded from the canonical list during migration 002. Each workspace has its own isolated department catalogue.

### members

```sql
CREATE TABLE members (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT    NOT NULL,
  email        TEXT    NOT NULL,
  role         TEXT    NOT NULL,
  department   TEXT    NOT NULL,
  start_date   TEXT    NOT NULL,              -- ISO date string: YYYY-MM-DD
  is_active    INTEGER NOT NULL DEFAULT 1,    -- 1 = active, 0 = inactive
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  workspace_id INTEGER NOT NULL DEFAULT 1 REFERENCES workspaces(id),
  UNIQUE (email, workspace_id)
)
```

- `updated_at` is updated manually in the PATCH handler (not via trigger).
- The UNIQUE constraint was changed from `UNIQUE(email)` to `UNIQUE(email, workspace_id)` in migration 004.
- Soft-delete (DELETE endpoint) sets `is_active=0` and prepends `deactivated-` to `email` (TM-101 flow).
- Note: seed data has inconsistent department names — some use `"Engineering"`, others `"Eng"`.

### audit_log

```sql
CREATE TABLE audit_log (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_email  TEXT    NOT NULL,              -- Email of the user who performed the action
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id),
  action       TEXT    NOT NULL,              -- e.g. 'member.create', 'member.update', 'member.delete', 'member.export'
  entity_id    INTEGER,                       -- ID of the affected member row; NULL for bulk actions (e.g. export)
  at           TEXT    NOT NULL DEFAULT (datetime('now'))
)
```

Every member create / update / delete and every export download writes a row. The Compliance team queries this table for SOC 2 evidence. Use the `writeAuditLog(db, entry)` helper exported from `db.ts` rather than writing INSERT statements directly.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/members` | List active members (`is_active = 1`), ordered by name. Optional `?department=X` filter (used by Looker dashboards — TM-102 compatible). Scoped to resolved workspace via `X-Workspace-Id` header. |
| POST | `/api/members` | Create member; required: `name, email, role, department, start_date`. Workspace-scoped; `department` validated against workspace `bamboohr_dept_code_list` if non-empty. |
| GET | `/api/members/:id` | Get single member by ID (includes inactive). Workspace-scoped. |
| PATCH | `/api/members/:id` | Partial update: `name, email, role, department`. Workspace-scoped; `department` validated if provided. |
| DELETE | `/api/members/:id` | Soft-delete: sets `is_active=0` and prefixes email with `deactivated-` (TM-101 flow). Workspace-scoped. |
| GET | `/api/members/export` | Download workspace-scoped members as CSV (`members.csv`). Optional `?workspace=X` query param selects the target workspace slug. Column order: `id,name,email,role,department,start_date,is_active` (TM-101 column-stability rule). |
| GET | `/api/members/stats` | Total active count + breakdown by department. Workspace-scoped. |
| GET | `/api/workspaces` | List workspaces accessible to the authenticated user (requires Okta session). Response: `{ user: { email }, workspaces: [{ id, slug, name }] }`. |
| GET | `/api/config` | Returns feature flags. Response: `{ featureFlags: { workspaceSwitcher: boolean } }`. No auth required. |
| GET | `/api/departments` | List departments for the active workspace (resolved from `X-Workspace-Id`). Response: `{ departments: [{ id, name }] }`. No Okta session required. |

> **Route order matters:** `/export` and `/stats` are registered before `/:id` to prevent them from being captured as ID params.

## Workspace Context

All multi-workspace API calls are scoped via the `X-Workspace-Id` HTTP request header. The value is the workspace **slug** (e.g. `brightline`, `parent-co`).

### Header resolution rules

| Scenario | Header present? | Okta session? | Resolved workspace | Auth check |
|---|---|---|---|---|
| Legacy consumer (Looker, BambooHR nightly) | No | No | `parent-co` | None — backward-compat path |
| Workspace-aware client (UI, service account) | Yes | Yes | Value of header | Must be in user's allowed workspaces or → 403 |
| Workspace header but no session | Yes | No | Value of header | → 401 |

### Backward-compatibility window

During the **one-quarter parallel-run period**, headerless requests to `/api/members*` routes continue to resolve to the `parent-co` workspace without requiring an Okta session. This keeps Looker dashboards and the BambooHR weekly exporter working without changes.

**Before the window closes**, all legacy consumers must:
1. Obtain a service account with membership in the `tb-workspace-parent-co` Okta group.
2. Add `X-Workspace-Id: parent-co` to every request.

After the window closes, headerless requests that lack an Okta session will receive `401`.

### `resolveWorkspace` middleware

Applied to every `/api/members*` route and `/api/departments`. Sets `req.workspaceId`, `req.workspaceSlug`, `req.allowedWorkspaceSlugs`, and `req.actorEmail`.

### `requireWorkspaceAccess` middleware

Applied after `resolveWorkspace`. Enforces the two-tier auth model described in the table above. Returns `401` or `403` on violations.

## Feature Flags

Feature flags are served by `GET /api/config` as `{ featureFlags: { ... } }` and are read from environment variables at runtime.

| Flag | Env var | Default | Description |
|---|---|---|---|
| `workspaceSwitcher` | `FEATURE_WORKSPACE_SWITCHER` | `false` (unset) | Controls visibility of the workspace-switcher dropdown in the top bar. Set to `'1'` to enable. |

### Lifecycle

1. **Off (default):** Env var unset. Switcher is hidden; UI behaves as single-workspace.
2. **Internal rollout:** Set `FEATURE_WORKSPACE_SWITCHER=1` on staging / for internal users only.
3. **Broad rollout:** Enable on production for all users once subsidiary data is live.
4. **Cleanup:** Remove the env var check and the hidden-branch code after all workspaces are onboarded.

See `ROLLOUT.md` for the full flag lifecycle and rollback procedures.

## Okta Integration

### Required environment variables

| Variable | Description |
|---|---|
| `OKTA_ISSUER` | Okta authorization server issuer URL, e.g. `https://your-org.okta.com/oauth2/default` |
| `OKTA_CLIENT_ID` | OIDC application client ID |
| `OKTA_CLIENT_SECRET` | OIDC application client secret |
| `APP_BASE_URL` | Base URL of the TeamBoard app, e.g. `https://teamboard.internal` — used for OIDC redirect URIs |
| `SESSION_SECRET` | Secret used to sign the Express session cookie (use a long random string in production) |

### Workspace group naming convention

Each workspace maps to an Okta group named `tb-workspace-<slug>`, where `<slug>` is the workspace's URL-safe slug:

| Workspace | Okta group |
|---|---|
| Parent Co | `tb-workspace-parent-co` |
| Brightline | `tb-workspace-brightline` |
| Northstar Logistics | `tb-workspace-northstar-logistics` |
| Helio Studios | `tb-workspace-helio-studios` |

The `extractWorkspaceSlugs(req)` helper (in `server/src/middleware/auth.ts`) reads the `groups` claim from the Okta userinfo response, filters entries with the `tb-workspace-` prefix, and returns only the slug portion.

### Okta Admin console configuration

In the Okta Admin console, under **Applications → TeamBoard → Sign On → OpenID Connect ID Token**, add a **Groups claim filter** with the following settings:

- **Claim name:** `groups`
- **Filter type:** Matches regex
- **Regex:** `^tb-workspace-`

This ensures only `tb-workspace-*` groups are included in the token, keeping the payload size small and avoiding leaking unrelated group memberships.

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
- `PORT` is optional and defaults to `4060`.
- Okta integration requires additional env vars — see the **Okta Integration** section for the full list (`OKTA_ISSUER`, `OKTA_CLIENT_ID`, `OKTA_CLIENT_SECRET`, `APP_BASE_URL`, `SESSION_SECRET`). These are required for workspace-aware auth; the app still starts without them but all authenticated routes will fail.
- The `data/` directory and `team.db` are created automatically on first server start.
- There is **no linter/formatter config** in this project.
- There is **no CI/CD pipeline** configured.
- The `data/team.db` file is gitignored (only `data/.gitkeep` is tracked).
- `dist/` is gitignored — always run `pnpm build` after cloning or after server changes before running `pnpm dev`.
- Test suite: `pnpm test` (runs `pnpm build && node --test dist/server/src/__tests__/workspace.test.js`).

## Team process

- **audit_log migration PR** — requires **Compliance sign-off recorded as a PR comment** before the PR may be merged. Tag the Compliance team reviewer when opening the PR and do not merge until a sign-off comment is present.
- **members schema change PR** — requires **People Ops review** before merge. Tag the People Ops reviewer when opening the PR.
- See `ROLLOUT.md` for the complete rollout, migration, and cutover sequence including the feature-flag lifecycle and rollback steps per phase.
