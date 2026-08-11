---
name: architecture
description: Real component shape of TeamBoard — client, server, DB, and how they talk
type: knowledge
scope: global
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - client/vite.config.ts
  - client/src/App.tsx
  - server/src/index.ts
  - server/src/db.ts
  - package.json
---

```mermaid
flowchart LR
    Browser -->|fetch /api/*| ViteDev[Vite dev server :5173]
    ViteDev -->|proxy /api| Express[Express app :4060\nserver/src/index.ts]
    Express --> MembersRouter[members router\nserver/src/routes/members.ts]
    MembersRouter -->|node:sqlite DatabaseSync| SQLite[(data/team.db)]
```

- The client never talks to the server directly in dev — Vite's `server.proxy` (`client/vite.config.ts:7-11`) forwards `/api` to `http://localhost:4060`. In production there's no built-in reverse proxy; `pnpm start` only serves the compiled API (`server/src/index.ts`), so serving the built client is out of scope of this repo as it stands.
- `server/src/index.ts` mounts a single router (`membersRouter`) at `/api/members` — there is only one route module in the whole server.
- `getDb()` (`server/src/db.ts:11-48`) lazily opens one process-wide `DatabaseSync` handle and seeds it on first call if the `members` table is empty; there's no connection pool or separate migration step.
