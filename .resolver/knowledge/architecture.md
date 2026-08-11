---
name: architecture
description: Runtime shape of TeamBoard — Vite dev proxy, Express router, SQLite file
type: knowledge
scope: global
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - client/vite.config.ts
  - server/src/index.ts
  - server/src/routes/members.ts
  - server/src/db.ts
---

```mermaid
flowchart LR
    subgraph Client["client/src (Vite, port 5173)"]
        AppTsx["App.tsx"]
    end

    subgraph Server["server/src (Express, port 4060)"]
        IndexTs["index.ts"]
        MembersRouter["routes/members.ts"]
    end

    DB["data/team.db (node:sqlite)"]

    AppTsx -- "fetch /api/members*" --> ViteProxy["Vite dev proxy (/api → :4060)"]
    ViteProxy --> IndexTs
    IndexTs -- "app.use('/api/members', ...)" --> MembersRouter
    MembersRouter -- "getDb()" --> DB
```

- The client never talks to the server directly in dev — `client/vite.config.ts` proxies every `/api/*` request to `http://localhost:4060`, so `App.tsx` can call bare paths like `fetch('/api/members')`.
- `getDb()` in `server/src/db.ts` is a lazy singleton: the first call creates/opens `data/team.db`, runs `CREATE TABLE IF NOT EXISTS`, and seeds 8 rows if the table is empty. Every route handler calls `getDb()` per-request but reuses the same connection.
- There is no separate build/serve step for production — `pnpm start` runs the compiled Express server only; static client hosting isn't wired up in this repo (no `express.static` call in `server/src/index.ts`).
