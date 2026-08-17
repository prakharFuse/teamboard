---
name: architecture
description: Real component shape of TeamBoard — client, server, and DB, and how they talk
type: knowledge
scope: global
updated: 2026-08-17 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - client/vite.config.ts
  - server/src/index.ts
  - server/src/db.ts
  - server/src/routes/members.ts
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
    Client["client/src (React + Vite)\nport 5173"] -- "/api/* proxied\n(vite.config.ts)" --> Server["server/src (Express)\nport 4060"]
    Server -- "app.use('/api/members', ...)" --> Members["routes/members.ts\n(CRUD + /export + /stats)"]
    Members -- "getDb()" --> DB[("data/team.db\nnode:sqlite DatabaseSync")]
```

Two independently-run processes (`pnpm dev:client`, `pnpm dev:server`,
launched together by `pnpm dev` via `concurrently`) — there is no shared
in-process import between `client/` and `server/`. The only integration point
is the HTTP proxy Vite sets up for `/api` (client/vite.config.ts:8-10) to the
Express server on port 4060 (server/src/index.ts:6). `getDb()`
(server/src/db.ts:11) lazily opens a single module-level `DatabaseSync`
handle shared by every route in members.ts.
