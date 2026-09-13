---
name: architecture
description: System shape — how client, server, and DB actually talk
type: knowledge
scope: global
updated: 2026-09-13 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - client/vite.config.ts
  - server/src/index.ts
  - server/src/routes/members.ts
  - server/src/db.ts
  - package.json
sources_sha256:
  client/vite.config.ts: 8ce4f4d02ae0440e227419fbeca975395f8a11f6939d20e40f207deb3b6667e6
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/index.ts: 6c2c286cd087d1bbf54d47cbab8b0ee3aa1e86795a2a1a615588e18f9541762b
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

```mermaid
flowchart LR
  subgraph Client["client (Vite, :5173)"]
    App["App.tsx"]
  end

  subgraph Server["server (Express, :4060)"]
    Index["index.ts"]
    Router["routes/members.ts"]
  end

  DB[("data/team.db\n(node:sqlite)")]

  App -- "fetch /api/members\n/api/members/stats\n/api/members/export\nDELETE /api/members/:id" --> Index
  Index -- "app.use('/api/members', ...)" --> Router
  Router -- "getDb()" --> DB
```

- The client never talks to the server directly by host:port — Vite's dev
  proxy (`client/vite.config.ts:8`) forwards any `/api/*` request to
  `http://localhost:4060`, so both must be running (`pnpm dev` starts both
  via `concurrently`).
- `getDb()` (`server/src/db.ts:11`) is a module-level singleton: the first
  call opens/creates `data/team.db`, creates the table if missing, and seeds
  8 rows if the table is empty. Every route handler calls `getDb()` fresh but
  gets the same connection.
- There's no separate service boundary beyond client/server — `members.ts` is
  the only router, mounted once at `/api/members` in `server/src/index.ts:11`.
