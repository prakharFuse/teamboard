---
name: architecture
description: Real request/data flow between client, server, and SQLite
type: knowledge
scope: global
updated: 2026-09-12 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - client/vite.config.ts
  - server/src/index.ts
  - server/src/routes/members.ts
  - server/src/db.ts
sources_sha256:
  client/vite.config.ts: 8ce4f4d02ae0440e227419fbeca975395f8a11f6939d20e40f207deb3b6667e6
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/index.ts: 6c2c286cd087d1bbf54d47cbab8b0ee3aa1e86795a2a1a615588e18f9541762b
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

```mermaid
flowchart LR
    subgraph Client["client (Vite dev server :5173)"]
        App["App.tsx"]
    end

    subgraph Server["server (Express :4060)"]
        Index["index.ts"]
        Router["routes/members.ts"]
        Db["db.ts (getDb)"]
    end

    Sqlite[("data/team.db\n(node:sqlite)")]

    App -- "fetch /api/members\n/api/members/stats\n/api/members/:id" --> Index
    App -- "GET /api/members/export\n(plain <a href>)" --> Index
    Index -- "app.use('/api/members', membersRouter)" --> Router
    Router -- "getDb()" --> Db
    Db -- "DatabaseSync(DB_PATH)" --> Sqlite
```

- The Vite config (`client/vite.config.ts`) proxies `/api` to `http://localhost:4060`, so in dev the client never talks to the server directly — always through the proxy. There's no separate API base URL to configure.
- `getDb()` is a lazy singleton (module-level `db` variable) — the file is created and seeded only on first call, not at server startup. Every route handler calls `getDb()` per-request rather than holding a reference.
- CSV export (`/api/members/export`) is a plain link (`<a href>` in `App.tsx`), not a `fetch` call — it triggers a full browser navigation/download, not an XHR.
