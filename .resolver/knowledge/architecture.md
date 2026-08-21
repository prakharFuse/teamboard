---
name: architecture
description: Real component shape of TeamBoard — client, server, DB, and how they connect
type: knowledge
scope: global
updated: '2026-08-21'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
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
    Browser[Browser] -->|fetch /api/*| ViteDev[Vite dev server :5173]
    ViteDev -->|proxy /api → :4060| Express[Express app\nserver/src/index.ts]
    Browser -->|prod: served by nothing here\nno static-serving code| Express
    Express --> Router[membersRouter\nserver/src/routes/members.ts]
    Router --> DB[(SQLite\ndata/team.db via node:sqlite)]
```

- The client never talks to the server directly in dev — Vite's `server.proxy`
  (`client/vite.config.ts`) forwards `/api` to `http://localhost:4060`. There is
  no reverse proxy or gateway beyond that.
- `pnpm start` runs only `dist/server/index.js` — there is no code path in this
  repo that serves the built client from Express (no `express.static`, no SPA
  fallback route). Production serving of `client`'s build output is not wired
  up anywhere in the source.
- `getDb()` (`server/src/db.ts`) is a lazy singleton: the first call opens (and
  seeds, if empty) `data/team.db`, or an in-memory DB when
  `TEAMBOARD_DB_PATH=:memory:` (used by tests). All requests share this one
  `DatabaseSync` handle — there is no connection pool.
