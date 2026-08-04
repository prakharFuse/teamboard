---
name: architecture
description: Real request flow between client, server, and SQLite — read when tracing how a request or build actually moves
type: knowledge
scope: global
updated: '2026-08-04'
captured_sha: 954ac8ebcb7dafaa72672682a58e3bc82599f6e3
sources:
  - client/vite.config.ts
  - server/src/index.ts
  - server/src/db.ts
  - server/src/routes/members.ts
  - package.json
---

```mermaid
flowchart LR
  Browser -->|"fetch /api/*"| ViteDev["Vite dev server :5173"]
  ViteDev -->|"proxy /api → :4060"| Express["Express app (server/src/index.ts) :4060"]
  Express --> MembersRouter["membersRouter (server/src/routes/members.ts)"]
  MembersRouter -->|"getDb()"| SQLite["node:sqlite DatabaseSync (server/src/db.ts)"]
  SQLite --> File["data/team.db (gitignored)"]
```

- The client never talks to Express directly in dev — `client/vite.config.ts`
  proxies `/api` to `http://localhost:4060`, and in production the compiled
  client is served separately (there's no static-file serving wired into
  `server/src/index.ts`; it only mounts `/api/members`).
- `getDb()` is a lazy singleton (`server/src/db.ts:9-16`) — the first caller
  in a process creates the file/tables and seeds 8 rows if the table is
  empty. Every route handler calls `getDb()` per-request rather than holding
  a shared reference, but they all resolve to the same module-level `db`.
- There is no ORM/query-builder layer — routes in `members.ts` call
  `db.prepare(...).run/get/all(...)` directly.
