---
name: CLAUDE
description: Team claude-md rules from CLAUDE.md
type: convention
scope: global
updated: '2026-08-05'
captured_sha: 954ac8ebcb7dafaa72672682a58e3bc82599f6e3
sources:
  - CLAUDE.md
---

> Ingested verbatim from `CLAUDE.md` — the user-owned source of truth. Edit that file, not this page; this page is re-derived when the source changes.

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
