---
name: architecture
description: How the client, server, and database actually talk — real request paths
type: knowledge
scope: global
updated: '2026-09-01'
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
    Browser -->|GET /| Vite["Vite dev server :5173\n(client/, React)"]
    Browser -->|fetch /api/*| Vite
    Vite -->|proxy /api -> :4060| Express["Express app :4060\n(server/src/index.ts)"]
    Express --> Router["membersRouter\n(server/src/routes/members.ts)"]
    Router --> DB["node:sqlite DatabaseSync\n(server/src/db.ts)"]
    DB --> File["data/team.db\n(gitignored, auto-created)"]
```

- The client never talks to port 4060 directly — Vite's dev-server proxy
  (`client/vite.config.ts`, `server.proxy['/api']`) rewrites `/api/*` to
  `http://localhost:4060`. There's no CORS config needed on that path, but
  `server/src/index.ts` still calls `app.use(cors())` — relevant if the API
  is ever hit from a different origin than the Vite proxy (e.g. `pnpm start`
  serving only the compiled API with a separately hosted client).
- `getDb()` in `db.ts` is a lazy singleton: the first call opens (and, if
  needed, creates + seeds) the SQLite file; every route handler calls
  `getDb()` per-request but gets the same connection.
- There is no separate migrations system — schema (`CREATE TABLE IF NOT
  EXISTS`) and seed data live inline in `getDb()` and run on first access.
