---
name: architecture
description: Real runtime shape of TeamBoard — client, server, and DB, and how they talk
type: knowledge
scope: global
updated: '2026-08-14'
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
    subgraph Client["client/src (Vite dev server :5173)"]
        App["App.tsx\n(fetch calls)"]
    end

    subgraph Server["server/src (Express :4060)"]
        Index["index.ts\n(cors, json, mount router)"]
        Router["routes/members.ts\n(Router)"]
    end

    DB[("data/team.db\n(node:sqlite DatabaseSync)")]

    App -- "fetch('/api/members*')\nproxied via vite server.proxy" --> Index
    Index --> Router
    Router -- "getDb() singleton" --> DB
```

- The client never talks to the server directly in dev — `client/vite.config.ts` proxies any `/api` path from `:5173` to `http://localhost:4060`, so `pnpm dev` must run both processes (`pnpm dev` uses `concurrently` for exactly this — see `package.json`).
- There is only one router (`membersRouter`), mounted once at `/api/members`. All six endpoints (list, create, get, patch, delete, export, stats) live in the single file `server/src/routes/members.ts`.
- `getDb()` is called independently inside every route handler (no middleware injects it) — each call returns the same lazily-created singleton, so there's effectively one DB connection for the process.
