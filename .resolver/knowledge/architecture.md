---
name: architecture
description: How the client, server, and DB actually wire together
type: knowledge
scope: global
updated: '2026-08-11'
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
  Browser -->|fetch /api/members*| ViteDevServer["Vite dev server :5173\n(client/vite.config.ts)"]
  ViteDevServer -->|proxy /api| Express["Express app :4060\n(server/src/index.ts)"]
  Express --> MembersRouter["membersRouter\n(server/src/routes/members.ts)"]
  MembersRouter -->|getDb| SQLite["DatabaseSync\n(server/src/db.ts)"]
  SQLite --> File["data/team.db\n(gitignored)"]
```

- The client never talks to Express directly in dev — Vite's `server.proxy` (`client/vite.config.ts:8-10`) forwards `/api/*` to `http://localhost:4060`. In production (`pnpm build` + `pnpm start`), there is no proxy config for a built client bundle — `package.json`'s `start` script only runs the compiled server (`dist/server/index.js`), so serving the built client is out of scope of the current scripts.
- `getDb()` (`server/src/db.ts:11`) is a lazy singleton: the first call creates the file/table/seed rows, every subsequent call in the same process reuses the same `DatabaseSync` handle. Tests exploit this by setting `TEAMBOARD_DB_PATH=':memory:'` before the first request.
