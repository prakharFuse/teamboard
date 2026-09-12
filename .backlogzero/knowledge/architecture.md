---
name: architecture
description: How the client, Express server, and SQLite DB connect — read before changing routing, proxying, or DB init
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
    Browser -->|"fetch('/api/members...')"| Vite["Vite dev server :5173\n(client/vite.config.ts)"]
    Vite -->|proxy '/api' -> localhost:4060| Express["Express app :4060\n(server/src/index.ts)"]
    Express --> Router["membersRouter\n(server/src/routes/members.ts)"]
    Router -->|getDb| DB["node:sqlite DatabaseSync\n(server/src/db.ts)"]
    DB --> File["data/team.db\n(gitignored, auto-created)"]
```

- The client never talks to port 4060 directly in dev — it calls relative paths (`/api/members`, see `client/src/App.tsx:30,36,49,71`), and Vite's dev-only proxy (`client/vite.config.ts:8-10`) forwards `/api/*` to `http://localhost:4060`. In production there is no built-in reverse proxy — `client` is a static Vite build with no equivalent proxy step configured in this repo, so serving the built client behind the API host is left to whoever deploys it.
- `getDb()` (`server/src/db.ts:11`) is a lazy singleton: the first call creates/opens the SQLite file (or `:memory:` if `TEAMBOARD_DB_PATH` is set) and runs `CREATE TABLE IF NOT EXISTS` + seed inserts; every later call reuses the same in-process `DatabaseSync` handle. There is no connection pool — one process, one handle.
