---
name: architecture
description: How the client, server, and SQLite DB fit together and talk to each other
type: knowledge
scope: global
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - package.json
  - client/vite.config.ts
  - server/src/index.ts
  - server/src/db.ts
  - server/src/routes/members.ts
---

Layout and commands are already covered in [CLAUDE.md](../../CLAUDE.md) and [README.md](../../README.md) — see those for the file tree and `pnpm` scripts. This page captures the runtime shape.

```mermaid
flowchart LR
  Browser -->|"GET/POST/PATCH/DELETE :5173"| ViteDevServer["Vite dev server (:5173)"]
  ViteDevServer -->|"proxy /api/*"| ExpressApp["Express app (:4060)\nserver/src/index.ts"]
  ExpressApp -->|"mounted at /api/members"| MembersRouter["membersRouter\nserver/src/routes/members.ts"]
  MembersRouter -->|"getDb()"| SQLite["node:sqlite DatabaseSync\ndata/team.db"]
```

- The client never talks to the server directly by absolute URL — `client/vite.config.ts` proxies `/api` to `http://localhost:4060`, and `App.tsx` fetches relative paths (`/api/members`, `/api/members/stats`). In production (`pnpm start`) there is no proxy — the compiled server (`dist/server/index.js`) is the only process, so the client build would need to be served separately or from behind the same origin.
- `getDb()` (`server/src/db.ts:11`) is a lazy module-level singleton: the first caller wins the `DB_PATH`. In tests, `TEAMBOARD_DB_PATH=':memory:'` must be set before any route handler runs — see [[testing-conventions]].
