---
name: architecture
description: Real component shape and request flow for TeamBoard (client, server, DB)
type: knowledge
scope: global
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - client/vite.config.ts
  - server/src/index.ts
  - server/src/routes/members.ts
  - server/src/db.ts
  - package.json
---

```mermaid
flowchart LR
  Browser -->|"HTTP :5173"| ViteDev["Vite dev server\n(client/, vite.config.ts)"]
  ViteDev -->|"proxy /api/* -> :4060"| Express["Express app\n(server/src/index.ts)"]
  Express --> Router["membersRouter\n(server/src/routes/members.ts)\nmounted at /api/members"]
  Router -->|"getDb()"| DB["node:sqlite DatabaseSync\n(server/src/db.ts)"]
  DB --> File["data/team.db\n(gitignored file)"]
```

Notes on edges that aren't obvious from the file list alone:
- The client never talks to the server directly by port in dev — `client/vite.config.ts` proxies `/api` to `http://localhost:4060`, so `App.tsx` just calls relative paths like `fetch('/api/members')`.
- `getDb()` in `server/src/db.ts` is a lazy module-level singleton (`let db: DatabaseSync`) — the connection is opened on first call, not at import time. This matters for tests (see [[testing]]).
- There is only one router (`membersRouter`) and it owns everything under `/api/members`, including the non-CRUD `/export` and `/stats` sub-routes — those are defined *before* the `/:id` route in `members.ts` so Express doesn't try to parse "export"/"stats" as an id.
