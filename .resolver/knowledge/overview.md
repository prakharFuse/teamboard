---
name: overview
description: What TeamBoard is and where things live — start here before making changes
type: knowledge
scope: global
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - package.json
  - server/src/index.ts
  - client/src/main.tsx
---

TeamBoard is an internal team-directory app: Express + SQLite API, React (Vite) client. See ../../README.md for the tech stack, project layout, and API table, and ../../CLAUDE.md for the day-to-day command list and the API rules (error shape, parameterized SQL).

Runtime: Node >= 22.5 is a hard requirement — the server uses the built-in `node:sqlite` (`DatabaseSync`), not a third-party driver (`server/src/db.ts:1`).

No code today defines a canonical department list: the client (`client/src/App.tsx`) accepts any freeform "Department" text, and `POST /api/members` in `server/src/routes/members.ts` inserts it without checking it against a known set. See [[gotchas]] for the CI test that currently red-lines this behavior.
