---
name: architecture
description: Real request flow between client, server, and DB — read before touching routing, proxying, or process boundaries
type: knowledge
scope: global
updated: 2026-08-11 (IONE-959)
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
  Client["client/src (React, Vite dev server :5173)"]
  Server["server/src/index.ts (Express :4060)"]
  Router["server/src/routes/members.ts"]
  DB[("data/team.db (SQLite via node:sqlite)")]

  Client -- "fetch('/api/...') proxied by vite" --> Server
  Server -- "app.use('/api/members', ...)" --> Router
  Router -- "getDb() prepared statements" --> DB
```

Two independent processes in dev (`pnpm dev` runs both via `concurrently`): the Express server (compiled from `server/src/`, run with `node --watch`) and the Vite dev server (serving `client/src/` directly, no build step). They only talk over HTTP through the `/api` proxy — there's no shared in-process import between `client/` and `server/`, and the two `tsconfig.json` files (`client/tsconfig.json`, `server/tsconfig.json`) are configured independently. In production (`pnpm start`), only the compiled server runs — nothing serves the built client, so `pnpm build` only compiles `server/src` (see `package.json`'s `build` script targeting `server/tsconfig.build.json`).
