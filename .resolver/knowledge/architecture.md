---
name: architecture
description: How the client, server, and database actually connect — verified from source and config
type: knowledge
scope: global
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - client/vite.config.ts
  - client/src/App.tsx
  - server/src/index.ts
  - server/src/routes/members.ts
  - server/src/db.ts
---

```mermaid
flowchart LR
    Browser["Browser<br/>(App.tsx)"]
    Vite["Vite dev server<br/>:5173"]
    Express["Express app<br/>server/src/index.ts<br/>:4060"]
    Router["membersRouter<br/>server/src/routes/members.ts"]
    DB["SQLite file<br/>data/team.db<br/>(server/src/db.ts)"]

    Browser -->|fetch /api/members, /stats, /export| Vite
    Vite -->|proxy /api/*| Express
    Express -->|app.use('/api/members', membersRouter)| Router
    Router -->|node:sqlite DatabaseSync| DB
```

Two independent processes in dev (`pnpm dev` runs both via `concurrently`): Vite serves the React
client on 5173 and proxies any `/api` request to the Express server on 4060
(`client/vite.config.ts:8-10`); there is no shared process or in-memory call between them. In a
built/production run (`pnpm build && pnpm start`) only the Express server (`server/src/index.ts`)
runs — the client's static output isn't served by it, since `index.ts` never calls
`express.static`. Deploying the built client is out of scope for the current server code.

`getDb()` (`server/src/db.ts:11-48`) is a lazy singleton — the file/`:memory:` DB is opened and
seeded on first call, then reused for the process lifetime. Tests rely on this: setting
`TEAMBOARD_DB_PATH=':memory:'` before the first request (`server/src/routes/members.test.ts:24`)
routes that whole test run to an isolated in-memory DB instead of `data/team.db`.
