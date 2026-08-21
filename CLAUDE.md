# CLAUDE.md

## Project
TeamBoard — internal team directory. Express + React + SQLite.

## Layout
- `server/src/` — Express API (TypeScript, compiled to `dist/`)
- `client/src/` — React UI (Vite)
- `data/` — SQLite database (gitignored)

## Commands
- `pnpm install` — install dependencies
- `pnpm dev` — run server + client concurrently
- `pnpm build` — compile server TypeScript
- `pnpm typecheck` — type-check both server and client
- `pnpm lint` — ESLint over server and client (flat config, `eslint.config.mjs`)
- `pnpm test` — build, then run server tests via the Node test runner

## Endpoints
- GET /api/members — list active members
- POST /api/members — create member (name, email, role, department, start_date)
- GET /api/members/:id — get member by ID
- PATCH /api/members/:id — update member fields
- DELETE /api/members/:id — remove member
- GET /api/members/export — CSV export (HR integration)
- GET /api/members/stats — team statistics by department

## Rules
- API errors: `{ "error": string }` with appropriate HTTP status
- Prefer parameterized SQL (`?` placeholders) — no string concatenation
- SQLite via Node built-in `node:sqlite` (`DatabaseSync`), requires Node >= 22.5

## Config
- All tunable values (port, host, dbPath, csvFilename) live in `server/src/config.ts`, the single source of truth
- Override at runtime with `TEAMBOARD_*` env vars (e.g. `TEAMBOARD_PORT`); see README.md "Configuration" for the full table and how to add a value
