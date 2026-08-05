---
name: architecture
description: Runtime shape of TeamBoard — client, server, DB, and how they connect
type: knowledge
scope: global
updated: 2026-08-05 (IONE-959)
captured_sha: 954ac8ebcb7dafaa72672682a58e3bc82599f6e3
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
  subgraph Client["client/ (Vite + React, :5173)"]
    App["App.tsx"]
  end

  subgraph Server["server/ (Express, :4060)"]
    Index["index.ts\napp entrypoint"]
    Members["routes/members.ts\nRouter mounted at /api/members"]
    Db["db.ts\ngetDb()"]
  end

  SQLite[("data/team.db\nnode:sqlite DatabaseSync")]

  App -- "fetch /api/members\n(dev: Vite proxy)" --> Index
  Index -- "app.use('/api/members', membersRouter)" --> Members
  Members -- "getDb()" --> Db
  Db -- "DatabaseSync(DB_PATH)" --> SQLite
```

- The client never talks to SQLite directly — all access goes through the
  Express router in `server/src/routes/members.ts`.
- `getDb()` (`server/src/db.ts:11`) is a lazy singleton: the first call opens
  (and seeds) the DB file, every later call reuses the same `DatabaseSync`
  handle. There is no connection pool — this is a single-process, single-file
  SQLite setup, not meant to run multiple server instances against one file.
- In dev, the client (`:5173`) and server (`:4060`) are separate processes
  wired together only by the Vite proxy config; in a built/production deploy
  there is no static-file serving of the client from the Express app — `pnpm
  build`/`pnpm start` only run the server.

See [[data-model]] for the schema behind `Db`.
