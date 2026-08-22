---
name: architecture
description: Real component shape and request path for TeamBoard (client, server, DB) — read before touching routing, proxy, or build/start scripts
type: knowledge
scope: global
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - package.json
  - client/vite.config.ts
  - server/src/index.ts
  - server/src/db.ts
  - client/src/main.tsx
---

Layout and endpoint list are correct as documented in `../../CLAUDE.md` and `../../README.md` — see those first.

```mermaid
flowchart LR
  Browser -->|"HTTP :5173\n(dev only)"| ViteDevServer
  ViteDevServer -->|"proxies /api/* to :4060\n(vite.config.ts)"| ExpressApp
  ExpressApp[server/src/index.ts\nExpress app] --> MembersRouter[server/src/routes/members.ts]
  MembersRouter --> DbModule[server/src/db.ts\ngetDb]
  DbModule --> SqliteFile[(data/team.db\nnode:sqlite)]
```

## Gap: no production static-serving path

`server/src/index.ts` only mounts `/api/members` — it never serves `client/`'s built assets. `package.json`'s `build` script (`tsc -p server/tsconfig.build.json`) compiles the server only; there is no `build:client` script and no `express.static(...)` call anywhere in `server/src/`. The `/api` proxy in `client/vite.config.ts` only exists in the Vite dev server, so `pnpm start` (running the compiled server alone) has no route that serves the React app. Any change intended to ship a production client build needs to add both a client build step and static-file serving — neither exists today.

## DB singleton lifetime

`getDb()` (`server/src/db.ts:11`) memoizes a single module-level `db` connection and reads `TEAMBOARD_DB_PATH` only on module load of the first call. Tests rely on this: `server/src/routes/members.test.ts` sets `process.env.TEAMBOARD_DB_PATH = ':memory:'` before importing the router so the first `getDb()` call binds to the in-memory DB. Setting that env var after any handler has already run is a no-op.
