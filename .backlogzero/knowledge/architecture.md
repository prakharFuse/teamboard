---
name: architecture
description: Real component shape of TeamBoard — client, server, DB, and how they talk
type: knowledge
scope: global
updated: 2026-09-13 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - client/vite.config.ts
  - client/src/App.tsx
  - server/src/index.ts
  - server/src/routes/members.ts
  - server/src/db.ts
  - package.json
sources_sha256:
  client/src/App.tsx: 50903abfd99acdd441fab7e3084e6e6f1dc989627e78c4d76c0a4bc911639c14
  client/vite.config.ts: 8ce4f4d02ae0440e227419fbeca975395f8a11f6939d20e40f207deb3b6667e6
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/index.ts: 6c2c286cd087d1bbf54d47cbab8b0ee3aa1e86795a2a1a615588e18f9541762b
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

```mermaid
flowchart LR
    subgraph Client["client (Vite dev server, port 5173)"]
        App["App.tsx\n(fetch calls)"]
    end

    subgraph Server["server (Express, port 4060)"]
        Index["index.ts\n(app bootstrap, cors, json)"]
        Members["routes/members.ts\n(/api/members router)"]
        Db["db.ts\ngetDb()"]
    end

    Sqlite[("data/team.db\n(node:sqlite)")]

    App -- "fetch /api/members/*\n(proxied by vite server.proxy)" --> Index
    Index --> Members
    Members --> Db
    Db --> Sqlite
```

- The client never talks to the server directly by absolute URL: Vite's dev
  proxy (`client/vite.config.ts`) forwards `/api/*` to
  `http://localhost:4060`, so `App.tsx` just calls `fetch('/api/members')`.
- `db.ts` holds a single module-level `db` singleton (lazy-initialized on
  first `getDb()` call) — there's no connection pool or per-request client.
- Tests bypass the Express app bootstrap in `index.ts` entirely: they mount
  `membersRouter` directly on a throwaway `express()` instance
  (`server/src/routes/members.test.ts`), so `cors()` / global middleware in
  `index.ts` are not exercised by the test suite.
