---
name: architecture
description: System shape — client/server/DB processes and how they talk
type: knowledge
scope: global
updated: 2026-08-04 (IONE-959)
captured_sha: 954ac8ebcb7dafaa72672682a58e3bc82599f6e3
sources:
  - package.json
  - client/vite.config.ts
  - server/src/index.ts
  - server/src/routes/members.ts
  - server/src/db.ts
---

```mermaid
flowchart LR
  Client["React client<br/>(Vite dev server, :5173)"]
  Server["Express server<br/>(server/src/index.ts, :4060)"]
  Router["members router<br/>(server/src/routes/members.ts)"]
  DB[("SQLite<br/>data/team.db")]

  Client -- "fetch /api/* (dev proxy)" --> Server
  Server -- "app.use('/api/members', ...)" --> Router
  Router -- "DatabaseSync via getDb()" --> DB
```

Two independently-run processes in dev (`pnpm dev` via `concurrently`): the Vite client
proxies any `/api` request to `http://localhost:4060` (`client/vite.config.ts:9`), and the
Express server owns the SQLite connection as a lazily-initialized singleton (`server/src/db.ts:9-16`)
shared across all requests in-process — there is no connection pool.
