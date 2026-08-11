---
name: architecture
description: How the client, server, and DB actually connect at runtime — Mermaid diagram of the real shape
type: knowledge
scope: global
updated: 2026-08-11 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/index.ts
  - server/src/routes/members.ts
  - server/src/db.ts
  - client/src/App.tsx
  - client/vite.config.ts
  - package.json
---

```mermaid
flowchart LR
  subgraph Client["client/ (Vite, port 5173)"]
    App["App.tsx"]
  end

  subgraph Server["server/ (Express, port 4060)"]
    Index["index.ts"]
    Router["routes/members.ts"]
    Db["db.ts (getDb)"]
  end

  SQLite["data/team.db (node:sqlite)"]

  App -- "fetch /api/members\n/api/members/stats\n/api/members/export\n(dev: Vite proxy)" --> Index
  Index -- "app.use('/api/members', router)" --> Router
  Router -- "getDb()" --> Db
  Db -- "DatabaseSync(DB_PATH)" --> SQLite
```

Dev-time proxy: `client/vite.config.ts` proxies `/api` to `http://localhost:4060`, so the two
processes started by `pnpm dev` (`dev:server` + `dev:client`, see `package.json`) only talk to
each other over that path — there's no shared build step or import between `client/` and
`server/`. In production (`pnpm build && pnpm start`) only the server (`dist/server/index.js`)
runs; nothing serves the client build, so `pnpm start` alone does not serve the UI.

`getDb()` is a lazy singleton (module-level `db` variable, `server/src/db.ts`) — the DB file
and schema are created on first call, not at server startup, and `DB_PATH` is fixed at first
call (env var must be set before that, see [[testing]]).
