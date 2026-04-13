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

```sql
CREATE TABLE members (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  email       TEXT    NOT NULL UNIQUE,
  role        TEXT    NOT NULL,
  department  TEXT    NOT NULL,
  start_date  TEXT    NOT NULL,             -- ISO date string: YYYY-MM-DD
  is_active   INTEGER NOT NULL DEFAULT 1,   -- 1 = active, 0 = inactive
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
)
```

- The DB file lives at `data/team.db` relative to `process.cwd()` (project root).
- `updated_at` is updated manually in the PATCH handler (not via trigger).
- The `department` column stores BambooHR `dept_code` values (e.g. `"ENG"`, `"PRD"`), not display names. See [Department Codes](#department-codes).

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/members` | List active members (`is_active = 1`), ordered by name |
| POST | `/api/members` | Create member; required: `name, email, role, department, start_date`. `department` must be a valid `dept_code` (see [Department Codes](#department-codes)); invalid values return `400` with the allowed code list. |
| GET | `/api/members/:id` | Get single member by ID (includes inactive) |
| PATCH | `/api/members/:id` | Partial update: `name, email, role, department`. If `department` is provided, it must be a valid `dept_code` (see [Department Codes](#department-codes)); invalid values return `400` with the allowed code list. |
| DELETE | `/api/members/:id` | Hard delete member |
| GET | `/api/members/export` | Download all members as CSV (`members.csv`); CSV header uses `dept_code` column at position 5 (same position as the former `department` column — BambooHR reads by position) |
| GET | `/api/members/stats` | Total active count + breakdown by department |

> **Route order matters:** `/export` and `/stats` are registered before `/:id` to prevent them from being captured as ID params.

## Department Codes

The `department` field stores BambooHR canonical **dept_codes** (not display names). Only the following 9 codes are accepted by the API:

| Code | Display Name |
|------|--------------|
| ENG  | Engineering  |
| PRD  | Product      |
| DSN  | Design       |
| MKT  | Marketing    |
| SLS  | Sales        |
| OPS  | Operations   |
| FIN  | Finance      |
| HR   | HR           |
| LEG  | Legal        |

**Source of truth:** `server/src/departments.ts` is the code-level source of truth, derived from the BambooHR canonical CSV supplied by People Ops. The client mirrors the same map in `client/src/App.tsx` (as `DEPARTMENT_MAP`) for display purposes only.

- POST and PATCH requests with an unrecognized `department` value return `400` with the full list of allowed codes.
- The CSV export uses `dept_code` as the column header (position 5) so BambooHR positional import recognises the values correctly.
- If a new department is needed, it must be added in BambooHR first by People Ops, then added to `server/src/departments.ts`. Do not add it only in TeamBoard.

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