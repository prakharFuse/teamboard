---
name: architecture
description: Real component shape and request flow — client, Express server, SQLite file
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
  subgraph Client["client/ (Vite dev server :5173)"]
    App["App.tsx\n(single component)"]
  end

  subgraph Server["server/ (Express :4060)"]
    Index["index.ts\napp.listen"]
    Router["routes/members.ts\nRouter"]
    Db["db.ts\ngetDb() singleton"]
  end

  SqliteFile[("data/team.db\n(node:sqlite DatabaseSync)")]

  App -- "fetch('/api/members', ...)\nvia Vite proxy" --> Index
  Index -- "app.use('/api/members', membersRouter)" --> Router
  Router -- "getDb()" --> Db
  Db -- "DatabaseSync(DB_PATH)" --> SqliteFile
```

- The client never talks to the server directly in dev — `client/vite.config.ts:8` proxies `/api` to `http://localhost:4060`. In production there's no reverse proxy configured anywhere in the repo; `pnpm build` only compiles the server (`package.json:13`), so serving the built client is not wired up.
- `getDb()` (`server/src/db.ts:11`) is a module-level singleton: the first caller's `DB_PATH` (from `TEAMBOARD_DB_PATH`, defaulting to `data/team.db`) wins for the process lifetime. There is one Express app, one router, one DB connection — no connection pooling, no per-request DB handles.
- No message queue, no external services, no auth layer — `cors()` and `express.json()` (`server/src/index.ts:8-9`) are the only middleware.
