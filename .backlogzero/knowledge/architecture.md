---
name: architecture
description: How client, server, and DB actually talk — Vite proxy, Express router, SQLite
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
  Browser -->|"HTTP :5173"| ViteDevServer
  ViteDevServer -->|"proxies /api/*"| ExpressApp
  ExpressApp -->|"mounts at /api/members"| MembersRouter
  MembersRouter -->|"getDb()"| SQLite[("data/team.db\n(node:sqlite)")]

  subgraph client [client/src]
    ViteDevServer
    AppTsx["App.tsx"]
  end
  subgraph server [server/src]
    ExpressApp["index.ts"]
    MembersRouter["routes/members.ts"]
    Db["db.ts"]
  end
```

- The client never talks to SQLite directly — all access goes through
  `getDb()` in `server/src/db.ts:11`, called lazily per-request from
  `server/src/routes/members.ts`. `getDb()` memoizes a single module-level
  `db` connection for the process lifetime (`server/src/db.ts:9`).
- In dev, Vite (port 5173) proxies `/api` to the Express server (port 4060)
  per `client/vite.config.ts:8-10`; there is no shared build step wiring
  these together beyond that proxy rule.
- `server/src/routes/members.test.ts` bypasses both the proxy and the port
  4060 default: it builds an in-process Express app directly around
  `membersRouter` and points `TEAMBOARD_DB_PATH` at `:memory:`, so tests never
  touch `data/team.db`.
