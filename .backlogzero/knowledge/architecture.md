---
name: architecture
description: How the client, server, and DB actually connect at runtime — diagram
type: knowledge
scope: global
updated: 2026-09-04 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - client/vite.config.ts
  - server/src/index.ts
  - server/src/db.ts
  - package.json
sources_sha256:
  client/vite.config.ts: 8ce4f4d02ae0440e227419fbeca975395f8a11f6939d20e40f207deb3b6667e6
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/index.ts: 6c2c286cd087d1bbf54d47cbab8b0ee3aa1e86795a2a1a615588e18f9541762b
---

```mermaid
flowchart LR
  subgraph Client["client (Vite dev server, :5173)"]
    App["App.tsx"]
  end

  subgraph Server["server (Express, :4060)"]
    Index["index.ts"]
    Members["routes/members.ts"]
    Db["db.ts"]
  end

  SQLite[("data/team.db\n(node:sqlite)")]

  App -- "fetch('/api/members', ...)" --> Client
  Client -- "vite proxy '/api' -> localhost:4060" --> Index
  Index --> Members
  Members --> Db
  Db --> SQLite
```

Two independently-run processes, wired together only by the Vite dev proxy (`server: { proxy: { '/api': 'http://localhost:4060' } }` in `client/vite.config.ts`) — there is no shared code, no monorepo workspace boundary, and no build-time coupling between `client/` and `server/`. `pnpm dev` just runs both via `concurrently` (`package.json`).

`db.ts` lazily creates the SQLite file and seeds it on first `getDb()` call — there's no separate migration or seed script.
