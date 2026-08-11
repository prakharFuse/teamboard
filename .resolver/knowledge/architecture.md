---
name: architecture
description: Real shape of the client/server/DB split and how they talk — read before touching the request path
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
  subgraph Client["client/ — Vite dev server :5173"]
    App[App.tsx]
  end
  subgraph Server["server/ — Express :4060"]
    Index[index.ts]
    Router["routes/members.ts"]
  end
  DB[("data/team.db\n(SQLite, node:sqlite)")]

  App -- "fetch('/api/members*')\nproxied in dev" --> Index
  Index -- "app.use('/api/members', router)" --> Router
  Router -- "getDb()" --> DB
```

- The `/api` proxy (`client/vite.config.ts:9`) only exists in the Vite dev server. `server/src/index.ts` registers only the members router — there's no `express.static` call, so nothing serves the client's built assets in production. `pnpm build` (`package.json:13`) compiles the server only; the client build isn't wired into `build`/`start` at all.
- `getDb()` (`server/src/db.ts:11`) is a lazy module-level singleton shared by every route handler in a process — there's one `DatabaseSync` connection for the life of the server, not one per request.
