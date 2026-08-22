---
name: architecture
description: Real request/data flow across client, server, and SQLite — read before touching cross-cutting behavior
type: knowledge
scope: global
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - client/src/App.tsx
  - client/vite.config.ts
  - server/src/index.ts
  - server/src/routes/members.ts
  - server/src/db.ts
  - package.json
---

```mermaid
flowchart LR
  subgraph Client["client/src (Vite dev server :5173)"]
    App[App.tsx]
  end

  subgraph Server["server/src (Express :4060)"]
    Index[index.ts] --> Router[routes/members.ts]
    Router --> DB[db.ts: getDb]
  end

  SQLite[("data/team.db\n(node:sqlite DatabaseSync)")]

  App -- "fetch /api/members\n/api/members/stats\n/api/members/:id\n/api/members/export" --> Index
  DB --> SQLite
```

- The client never talks to SQLite directly — all reads/writes go through the
  five `router.*` handlers in `server/src/routes/members.ts`, which each call
  `getDb()` per-request.
- `getDb()` is a lazy singleton (`server/src/db.ts:11`): the first call opens the
  file (or `:memory:` if `TEAMBOARD_DB_PATH` is set — see [[testing]]), creates the
  table if missing, and seeds 8 rows if the table is empty. Every later call in the
  same process reuses that same `DatabaseSync` handle.
- There's no separate service/repository layer — route handlers issue SQL directly
  against `getDb()`. See [[backend]] for the convention this implies.
- The Vite dev server proxies `/api/*` to the Express server; there's no shared
  runtime process between `dev:server` and `dev:client` (`package.json` scripts),
  they're started together only via `concurrently`.
