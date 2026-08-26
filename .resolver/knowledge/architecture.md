---
name: architecture
description: Real shape of TeamBoard — client/server processes, the Vite dev proxy, and the single SQLite file
type: knowledge
scope: global
updated: 2026-08-26 (IONE-959)
captured_sha: 9751dd9cba13495abfa900c0f23381a2060fae7c
sources:
  - package.json
  - client/vite.config.ts
  - server/src/index.ts
  - server/src/db.ts
  - server/src/routes/members.ts
  - client/src/App.tsx
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
  Browser -->|"fetch /api/*"| ViteDev["Vite dev server :5173\n(client/src/App.tsx)"]
  ViteDev -->|"proxy /api → :4060\n(client/vite.config.ts)"| Express["Express app :4060\n(server/src/index.ts)"]
  Express --> MembersRouter["membersRouter\n(server/src/routes/members.ts)\nmounted at /api/members"]
  MembersRouter -->|"getDb()"| SQLite[("SQLite file\ndata/team.db\nvia node:sqlite\n(server/src/db.ts)")]
```

Two independent Node processes in dev, started together by `pnpm dev` (`concurrently`, see `package.json`): `dev:server` runs the compiled server (`node --watch dist/server/index.js`) and `dev:client` runs Vite. There is no build-time bundling between them — the client only ever talks to the server over HTTP through the `/api` proxy; there are no direct imports between `client/` and `server/`.

`getDb()` (`server/src/db.ts:11`) is a lazy module-level singleton — one `DatabaseSync` connection per server process, created on first request and reused for the process lifetime. There's no connection pool or teardown path in production; tests override the DB path to `:memory:` to get isolation instead (see `../conventions/testing.md`).
