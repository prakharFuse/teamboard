---
name: architecture
description: Real request flow between client, server, and DB — read before touching routing or the DB layer
type: knowledge
scope: global
updated: '2026-08-05'
captured_sha: 954ac8ebcb7dafaa72672682a58e3bc82599f6e3
sources:
  - client/vite.config.ts
  - server/src/index.ts
  - server/src/routes/members.ts
  - server/src/db.ts
---

```mermaid
flowchart LR
  Browser -->|"/api/* (dev-time proxy)"| ViteDev["Vite dev server :5173\n(client/vite.config.ts)"]
  ViteDev -->|proxy /api → :4060| Express["Express app :4060\n(server/src/index.ts)"]
  Browser -->|fetch('/api/...')| Express
  Express -->|"app.use('/api/members', ...)"| MembersRouter["members router\n(server/src/routes/members.ts)"]
  MembersRouter -->|"getDb()"| SQLite[("SQLite\ndata/team.db")]
```

- The client (`client/src/App.tsx`) always calls relative paths like `/api/members`
  — it never hardcodes a host/port. In dev this only works because Vite's dev
  server proxies `/api` to `http://localhost:4060` (`client/vite.config.ts`); in
  the compiled/prod setup there's no proxy config anywhere in the repo, so the
  client and `dist/server` must be served from the same origin for `fetch('/api/...')`
  to resolve.
- `getDb()` (`server/src/db.ts`) opens the SQLite connection once and caches it in
  a module-level `db` variable — every request from every route handler shares
  that single `DatabaseSync` instance for the process lifetime.
