---
name: architecture
description: Runtime shape — how the Vite client, Express server, and SQLite file talk to each other
type: knowledge
scope: global
updated: 2026-09-12 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - package.json
  - client/vite.config.ts
  - server/src/index.ts
  - server/src/db.ts
  - server/src/routes/members.ts
sources_sha256:
  client/vite.config.ts: 8ce4f4d02ae0440e227419fbeca975395f8a11f6939d20e40f207deb3b6667e6
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/index.ts: 6c2c286cd087d1bbf54d47cbab8b0ee3aa1e86795a2a1a615588e18f9541762b
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

```mermaid
flowchart LR
    Browser -->|"GET /, static assets"| ViteDevServer["Vite dev server\n(client/, port 5173)"]
    Browser -->|"fetch('/api/...')"| ViteDevServer
    ViteDevServer -->|"proxy /api/* (vite.config.ts)"| ExpressApp["Express app\n(server/src/index.ts, port 4060)"]
    ExpressApp -->|"mounted at /api/members"| MembersRouter["members router\n(server/src/routes/members.ts)"]
    MembersRouter -->|"getDb()"| SQLite[("SQLite file\ndata/team.db\n(node:sqlite)")]
```

- Client and server are two separate processes (`pnpm dev` runs both via `concurrently`); they only communicate over HTTP through the Vite proxy — there is no direct import between `client/` and `server/`.
- `getDb()` in `server/src/db.ts:11` lazily opens a single module-level `DatabaseSync` handle and seeds it on first call; every request handler in `members.ts` calls `getDb()` again but gets the same cached connection.
- Tests bypass the file DB entirely: `server/src/routes/members.test.ts` sets `TEAMBOARD_DB_PATH=':memory:'` before the first `getDb()` call and boots an ephemeral in-process Express server on a random port — no network dependency on port 4060.
