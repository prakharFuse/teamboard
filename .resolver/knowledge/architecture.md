---
name: architecture
description: Real component shape of TeamBoard (client, server, DB) and how they talk
type: knowledge
scope: global
updated: '2026-08-13'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/index.ts
  - server/src/db.ts
  - server/src/routes/members.ts
  - client/src/App.tsx
  - client/vite.config.ts
  - package.json
---

```mermaid
flowchart LR
  Browser["Browser (client/src/App.tsx)"]
  Vite["Vite dev server :5173\n(client/vite.config.ts, proxies /api)"]
  Express["Express app :4060\n(server/src/index.ts)"]
  Router["membersRouter\n(server/src/routes/members.ts)"]
  DB["SQLite file\ndata/team.db\n(server/src/db.ts, node:sqlite)"]

  Browser -- "fetch /api/members*" --> Vite
  Vite -- "proxy" --> Express
  Express -- "app.use('/api/members', ...)" --> Router
  Router -- "prepare/run/get/all" --> DB
```

Two independently-run processes, no shared runtime: `pnpm dev` starts them concurrently (`concurrently` in `package.json`), and the client only ever talks to the server over HTTP via the Vite proxy — there's no direct import between `client/` and `server/`. The server is a single Express app with one router (`membersRouter`) mounted at `/api/members`; all persistence goes through the single `getDb()` singleton in `db.ts`, which lazily opens the SQLite file (or `:memory:` when `TEAMBOARD_DB_PATH` is set, used by tests).
