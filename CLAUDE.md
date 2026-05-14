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
├── docs/
│   ├── ROLLOUT.md            — Staged deployment & cutover sequence (see Step 7 for Parent Co fallback removal)
│   └── AUDIT_LOG_SCHEMA.md   — audit_log column definitions + SOC 2 sample queries (Compliance sign-off required)
├── server/
│   ├── tsconfig.json         — TypeScript config for type-checking (with declarations)
│   ├── tsconfig.build.json   — Extends tsconfig.json, strips declarations/sourcemaps for build
│   └── src/
│       ├── index.ts          — Express app entry point; registers all routes and middleware
│       ├── db.ts             — SQLite singleton init, migrations, and seed data
│       ├── types/
│       │   └── express.d.ts  — Module augmentation: WorkspaceContext, OktaClaims on Request
│       ├── middleware/
│       │   ├── auth.ts             — Okta JWT verification (authMiddleware)
│       │   ├── workspaceContext.ts — Workspace resolution from Okta groups (workspaceContextMiddleware)
│       │   └── auditLog.ts         — Writes audit_log row on res.finish (auditLogMiddleware)
│       └── routes/
│           ├── members.ts    — All member CRUD endpoints (workspace-scoped)
│           ├── auth.ts       — POST /callback — Okta authorization-code exchange
│           ├── config.ts     — GET / — public feature-flags endpoint
│           └── workspaces.ts — GET / — list accessible workspaces for the authenticated user
├── client/
│   ├── index.html            — Vite HTML entry point
│   ├── tsconfig.json         — Client TypeScript config (bundler module resolution)
│   ├── vite.config.ts        — Vite config with /api proxy
│   └── src/
│       ├── main.tsx          — React entry (createRoot + StrictMode)
│       ├── App.tsx           — Single-component UI (workspace switcher, all state + fetch logic)
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
- **DELETE**: Soft-delete via `UPDATE members SET is_active=0, email='deactivated-'||email, updated_at=datetime('now')`. The row is retained for audit purposes; a UNIQUE constraint violation (already deactivated) returns 409.
- **Error format**: `{ "error": string }` with appropriate HTTP status codes (400, 404, 409).

### Client

- **Single component**: All logic lives in `App.tsx` — `useState` for form fields, members list, stats, and UI visibility.
- **Data fetching**: Plain `fetch()` — no external HTTP/data libraries.
- **API calls**: Use relative paths (e.g., `/api/members`) — Vite proxies to the server during dev.
- **Styling**: Plain CSS in `styles.css` — no Tailwind, no CSS-in-JS, no component library.

## Database Schema

```sql
-- One row per legal entity / tenant. Slug maps to the Okta group suffix (tb-workspace-<slug>).
CREATE TABLE workspaces (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  slug                    TEXT    NOT NULL UNIQUE,
  name                    TEXT    NOT NULL,
  bamboohr_dept_code_list TEXT    NOT NULL DEFAULT '[]',  -- JSON array of valid dept codes
  okta_group              TEXT                            -- e.g. tb-workspace-brightline
)

-- Per-workspace catalogue of valid department codes (enforces TM-103 validation per tenant).
CREATE TABLE departments (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT    NOT NULL,
  workspace_id INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  UNIQUE(name, workspace_id)
)

-- SOC 2 audit trail — every member create/update/delete and every export download.
CREATE TABLE audit_log (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_email  TEXT    NOT NULL,            -- authenticated user who performed the action
  workspace_id INTEGER NOT NULL,            -- FK to workspaces.id
  action       TEXT    NOT NULL,            -- HTTP method + normalised path, e.g. 'POST /api/members'
  entity_id    INTEGER,                     -- PK of the affected member row; NULL for list/stats/export
  at           TEXT    NOT NULL DEFAULT (datetime('now')),  -- UTC datetime
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
)

-- After the add_workspace_id_to_members migration the members table becomes:
CREATE TABLE members (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT    NOT NULL,
  email        TEXT    NOT NULL,
  role         TEXT    NOT NULL,
  department   TEXT    NOT NULL,
  start_date   TEXT    NOT NULL,              -- ISO date string: YYYY-MM-DD
  is_active    INTEGER NOT NULL DEFAULT 1,    -- 1 = active, 0 = soft-deleted
  workspace_id INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(email, workspace_id),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
)
```

- The DB file lives at `data/team.db` relative to `process.cwd()` (project root).
- `updated_at` is updated manually in the PATCH handler (not via trigger).
- Note: seed data has inconsistent department names — some use `"Engineering"`, others `"Eng"`.
- Migration bookkeeping is tracked in `schema_migrations (id, name, applied_at)`. The migration `add_workspace_id_to_members` is idempotent and reversible (see `docs/ROLLOUT.md` Step 1 for rollback procedure).
- Seed workspaces on first run: **Parent Co** (`parent-co`), **Brightline** (`brightline`), **Northstar Logistics** (`northstar-logistics`), **Helio Studios** (`helio-studios`).

## API Endpoints

### Public (no authentication required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/config` | Returns feature flags — `{ featureFlags: { workspaceSwitcher: boolean } }`. Fetched by the React client before authentication to determine UI behaviour. |
| POST | `/api/auth/callback` | Okta authorization-code exchange. Body: `{ code, redirectUri }`. Returns `{ token: string, workspaces: [{ id, slug, name }] }`. Responds 403 if the user has no `tb-workspace-*` Okta groups. |

### Authenticated (require valid Okta Bearer token + workspace context)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/workspaces` | List workspaces accessible to the authenticated user, ordered by name. Response: `{ workspaces: [{ id, slug, name }] }`. |
| GET | `/api/members` | List active members (`is_active = 1`) for the resolved workspace, ordered by name. |
| POST | `/api/members` | Create member in the resolved workspace; validates `department` against the workspace's `bamboohr_dept_code_list`. |
| GET | `/api/members/:id` | Get single member by ID within the resolved workspace (includes inactive). |
| PATCH | `/api/members/:id` | Partial update (`name, email, role, department`) within the resolved workspace; validates `department` when provided. |
| DELETE | `/api/members/:id` | **Soft-delete**: sets `is_active=0` and prefixes `email` with `"deactivated-"`. Returns 409 on UNIQUE violation (already deactivated). |
| GET | `/api/members/export` | Download workspace-scoped members as CSV (`members.csv`). Column order: `id, name, email, role, department, start_date, is_active` (TM-101). |
| GET | `/api/members/stats` | Total active count + breakdown by department for the resolved workspace. |

> **Route order matters:** `/export` and `/stats` are registered before `/:id` to prevent them from being captured as ID params.

> **Workspace resolution** (for all authenticated endpoints): the workspace is resolved in order from (1) `?workspace=<slug>` query param, (2) `X-Workspace-Id` request header, (3) `parent-co` fallback. The fallback exists for backwards compatibility with legacy consumers (Looker dashboards, BambooHR exporter) that do not send workspace context. **It will be removed on deploy date + 90 days** — see `docs/ROLLOUT.md` Step 7. Cross-workspace access returns 403.

## Middleware

All `/api/` routes except `/api/config` and `/api/auth` are protected by the following three-middleware chain, applied in strict order:

```
authMiddleware → workspaceContextMiddleware → auditLogMiddleware
```

| Middleware | File | Responsibility |
|---|---|---|
| `authMiddleware` | `server/src/middleware/auth.ts` | Strips `Bearer` token from `Authorization` header; verifies it via `@okta/jwt-verifier` (JWKS cached at module level). Attaches `req.rawClaims` on success; returns 401 on missing or invalid token. |
| `workspaceContextMiddleware` | `server/src/middleware/workspaceContext.ts` | Extracts `tb-workspace-*` Okta groups from `req.rawClaims.groups`; maps to slug list. Resolves target workspace from query param → header → `parent-co` fallback. Validates access and existence; populates `req.workspace`. Returns 403 on any failure. |
| `auditLogMiddleware` | `server/src/middleware/auditLog.ts` | Calls `next()` immediately (non-blocking). Registers a `res.on('finish', ...)` callback that inserts a row into `audit_log` with `actor_email`, `workspace_id`, `action` (`METHOD /path`), and `entity_id` (`res.locals.entityId ?? req.params.id ?? null`). Failures are swallowed (`console.error`) — audit errors never affect the HTTP response. |

**Registration order in `server/src/index.ts`:**

```
app.use('/api/config', configRouter)      // public
app.use('/api/auth',   authRouter)        // public
app.use('/api/',       authMiddleware)
app.use('/api/',       workspaceContextMiddleware)
app.use('/api/',       auditLogMiddleware)
app.use('/api/members',    membersRouter)
app.use('/api/workspaces', workspacesRouter)
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `OKTA_DOMAIN` | Yes | — | Okta org base URL, e.g. `https://your-org.okta.com` |
| `OKTA_CLIENT_ID` | Yes | — | Okta application client ID |
| `OKTA_AUTH_SERVER_ID` | Yes | — | Okta custom auth server ID, e.g. `ausXXXXXXXXXXXXXX` |
| `OKTA_AUDIENCE` | No | `api://default` | Expected JWT audience; must match the Okta auth server configuration |
| `OKTA_CLIENT_SECRET` | Yes | — | Okta client secret used in the `POST /api/auth/callback` token exchange |
| `FEATURE_WORKSPACE_SWITCHER` | No | `false` | Set to `"true"` to enable the workspace-switcher UI. Consumed by `GET /api/config`. |
| `PORT` | No | `4060` | HTTP port for the Express server |
| `BAMBOOHR_API_KEY_<SLUG_UPPERCASED>` | Per workspace | — | BambooHR API key for a specific workspace. Replace `<SLUG_UPPERCASED>` with the workspace slug in upper-snake-case, e.g. `BAMBOOHR_API_KEY_PARENT_CO`, `BAMBOOHR_API_KEY_BRIGHTLINE`, `BAMBOOHR_API_KEY_NORTHSTAR_LOGISTICS`, `BAMBOOHR_API_KEY_HELIO_STUDIOS`. |

> **Parent Co fallback sunset:** the `parent-co` default workspace resolution in `workspaceContextMiddleware` is intentionally temporary. It must be removed at **deploy date + 90 days** to complete the workspace isolation cutover. See `docs/ROLLOUT.md` Step 7 for the exact procedure and rollback steps.

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
- `@okta/jwt-verifier` ^3.x — Okta JWT verification with JWKS caching (used in `authMiddleware`)

**Dev:**
- `typescript` ^5.7
- `vite` ^6.0 + `@vitejs/plugin-react` ^4.3
- `react` ^19 + `react-dom` ^19
- `concurrently` ^9.1 — runs server + client together in `pnpm dev`
- Type packages: `@types/express`, `@types/cors`, `@types/react`, `@types/react-dom`

**No external SQLite package** — uses Node.js built-in `node:sqlite` (requires Node >= 22.5).

## Environment & Setup Notes

- **Node >= 22.5.0** is a hard requirement for `node:sqlite`.
- A `.env` file (or equivalent secret injection) is required in production — see the **Environment Variables** section above for the full list. Locally, the server still starts without Okta vars (unauthenticated requests will receive 401).
- The `data/` directory and `team.db` are created automatically on first server start.
- There is **no test suite** and **no linter/formatter config** in this project.
- There is **no CI/CD pipeline** configured.
- The `data/team.db` file is gitignored (only `data/.gitkeep` is tracked).
- `dist/` is gitignored — always run `pnpm build` after cloning or after server changes before running `pnpm dev`.
