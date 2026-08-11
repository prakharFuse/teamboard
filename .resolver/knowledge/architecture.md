---
name: architecture
description: Real request flow between client, server, and SQLite — read before changing how components talk to each other
type: knowledge
scope: global
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - client/vite.config.ts
  - server/src/index.ts
  - server/src/routes/members.ts
  - server/src/db.ts
  - package.json
---

```mermaid
flowchart LR
    Browser -->|fetch /api/*| ViteDevServer["Vite dev server :5173\n(client/vite.config.ts)"]
    ViteDevServer -->|proxy /api -> :4060| ExpressApp["Express app :4060\n(server/src/index.ts)"]
    ExpressApp -->|mounts /api/members| MembersRouter["membersRouter\n(server/src/routes/members.ts)"]
    MembersRouter -->|getDb()| DbModule["db.ts: DatabaseSync"]
    DbModule -->|file-backed| SqliteFile["data/team.db"]
```

- The client never talks to the server directly by port — Vite's dev proxy
  rewrites `/api/*` to `http://localhost:4060` (client/vite.config.ts:9). In
  production (`pnpm build` + `pnpm start`), only the Express server runs;
  there's no built-in static file serving for the client in `index.ts`, so
  the compiled client isn't served by the API process today.
- `getDb()` is a lazy singleton (`server/src/db.ts:9-12`): the first caller
  in a process creates the file/table and seeds 8 rows if empty. Tests flip
  this to an in-memory DB via `TEAMBOARD_DB_PATH=':memory:'` set before any
  route runs (server/src/routes/members.test.ts:24) — see [[testing]].
