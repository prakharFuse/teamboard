---
name: architecture
description: Real component shape of TeamBoard — client, server, and SQLite, with actual ports and proxy wiring
type: knowledge
scope: global
updated: 2026-08-12 (IONE-959)
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
  subgraph Client["client/src (Vite dev server :5173)"]
    App["App.tsx"]
  end

  subgraph Server["server/src (Express :4060)"]
    Index["index.ts"]
    Members["routes/members.ts"]
    Db["db.ts (getDb)"]
  end

  Sqlite[("data/team.db\n(node:sqlite DatabaseSync)")]

  App -- "fetch /api/members\n/api/members/stats\n/api/members/export\nGET/POST/PATCH/DELETE" --> Index
  Index -- "app.use('/api/members', membersRouter)" --> Members
  Members -- "getDb()" --> Db
  Db --> Sqlite
```

Vite's dev server proxies any `/api` request to `http://localhost:4060` (`client/vite.config.ts:9`), which is why the client's `fetch('/api/members')` calls (`client/src/App.tsx:30`) work without a full URL during `pnpm dev`. In production the client isn't served by Express at all — `pnpm build`/`pnpm start` only builds and runs the server (`package.json:13,17`); there's no static-file serving of the client bundle in `server/src/index.ts`.

`db.ts`'s `getDb()` is a lazy singleton — the module-level `db` variable is created on first call and reused, so all requests within one process share one `DatabaseSync` connection (`server/src/db.ts:9-16`).
