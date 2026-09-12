---
name: architecture
description: Real component shape of TeamBoard (client, server, DB) and how they talk
type: knowledge
scope: global
updated: 2026-09-12 (IONE-959)
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
    Browser["Browser (App.tsx)"] -->|"fetch('/api/members...')"| ViteProxy["Vite dev server\n(client/vite.config.ts)"]
    ViteProxy -->|"proxy /api -> :4060"| Express["Express app\n(server/src/index.ts)"]
    Express --> MembersRouter["membersRouter\n(server/src/routes/members.ts)"]
    MembersRouter -->|"prepared statements"| SQLite["node:sqlite DatabaseSync\n(server/src/db.ts)"]
    SQLite --> DBFile["data/team.db\n(or ':memory:' in tests)"]
```

- The client never talks to the server directly by host/port; it calls
  relative `/api/...` paths and relies on the Vite dev proxy
  (`client/vite.config.ts`) to forward to `http://localhost:4060`. There is
  no proxy/reverse-proxy config for a production deployment in this repo —
  `pnpm start` only serves the compiled server, so serving the built client
  in production is not wired up here.
- `getDb()` in `server/src/db.ts` is a lazy singleton: the first caller
  creates the `DatabaseSync` connection and seeds it if empty; every route
  handler in `members.ts` calls `getDb()` per-request but reuses the same
  connection.
