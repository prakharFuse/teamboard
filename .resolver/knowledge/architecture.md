---
name: architecture
description: How the client, server, and SQLite file actually talk — read before touching routing, proxy, or db.ts
type: knowledge
scope: global
updated: '2026-08-12'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - client/vite.config.ts
  - server/src/index.ts
  - server/src/db.ts
  - server/src/routes/members.ts
---

```mermaid
flowchart LR
  Browser -->|HTTP :5173| ViteDevServer
  ViteDevServer -->|proxy /api/*| ExpressApp
  Browser -.->|prod build served separately, no proxy| ExpressApp
  ExpressApp -->|mounts /api/members| MembersRouter
  MembersRouter -->|getDb| SQLite[("node:sqlite DatabaseSync")]
  SQLite --> DBFile[/data/team.db/]
```

- The Vite dev server (`client/vite.config.ts:8`) only proxies `/api` to
  `http://localhost:4060` in dev. There's no reverse proxy config for a
  production deployment in this repo — `pnpm build` only compiles the server
  (`package.json:13`); the client isn't part of that build script.
- `MembersRouter` is the only router mounted (`server/src/index.ts:11`) — all
  API surface lives in `server/src/routes/members.ts`.
- `getDb()` (`server/src/db.ts:11`) lazily opens a single module-level
  `DatabaseSync` connection and seeds it on first call. `TEAMBOARD_DB_PATH=:memory:`
  swaps the file for an in-memory DB — this is how tests isolate themselves
  (see `[[testing]]`).
