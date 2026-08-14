---
name: architecture
description: Real runtime shape of client, server, and DB, and how requests actually flow between them
type: knowledge
scope: global
updated: 2026-08-14 (IONE-959)
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
  Browser["Browser<br/>client/src/App.tsx"]
  Vite["Vite dev server :5173<br/>(proxies /api/*)"]
  Express["Express app :4060<br/>server/src/index.ts"]
  Router["membersRouter<br/>server/src/routes/members.ts"]
  DB["node:sqlite DatabaseSync<br/>data/team.db"]

  Browser -- "fetch('/api/members', ...)" --> Vite
  Vite -- "proxy /api → :4060" --> Express
  Express -- "app.use('/api/members', ...)" --> Router
  Router -- "getDb()" --> DB
```

Both `client` and `server` are separate pnpm scripts run concurrently by `pnpm dev` (see ../../CLAUDE.md) — there is no shared build or shared TypeScript project reference between them; the only contract is the `/api/members*` HTTP surface. `getDb()` (`server/src/db.ts:11`) is a lazily-initialized module-level singleton shared by every route handler in the same process.
