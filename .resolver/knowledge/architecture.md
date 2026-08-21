---
name: architecture
description: Real runtime shape of TeamBoard — client/server/DB wiring, verified against entrypoints and configs
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
  Client["client/src (React, Vite dev server :5173)"]
  Proxy["Vite proxy: /api/* -> :4060"]
  Server["server/src/index.ts (Express :4060)"]
  Router["routes/members.ts"]
  DB[("data/team.db via node:sqlite DatabaseSync")]

  Client -->|fetch '/api/...'| Proxy
  Proxy --> Server
  Server -->|app.use('/api/members', ...)| Router
  Router -->|prepare/run/get/all| DB
```

- The client never calls `http://localhost:4060` directly; it fetches relative
  `/api/...` paths, and only the Vite dev server (`client/vite.config.ts`)
  proxies those to the Express server. There is no proxy or static hosting in
  production — see the gap noted in `overview.md`.
- `db.ts` holds a single module-level `db` singleton created lazily on first
  `getDb()` call; every request handler in `members.ts` shares that one
  connection.
