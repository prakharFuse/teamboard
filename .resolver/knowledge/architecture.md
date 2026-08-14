---
name: architecture
description: Real system shape — client/server/db wiring and how requests flow through TeamBoard
type: knowledge
scope: global
updated: 2026-08-14 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/index.ts
  - client/vite.config.ts
  - server/src/routes/members.ts
  - server/src/db.ts
  - package.json
---

See ../../CLAUDE.md and ../../README.md for the stated layout and endpoint list — both are accurate. This page adds the wiring those docs don't spell out.

```mermaid
flowchart LR
  Browser -->|"fetch('/api/members...')"| ViteDevServer["Vite dev server :5173\n(client/vite.config.ts)"]
  ViteDevServer -->|proxy /api -> :4060| ExpressApp["Express app\nserver/src/index.ts"]
  ExpressApp --> MembersRouter["membersRouter\nserver/src/routes/members.ts"]
  MembersRouter -->|"getDb()"| SQLite[("SQLite\ndata/team.db\nvia node:sqlite DatabaseSync")]
```

Notes on edges that aren't obvious from file names alone:
- The client never talks to the server directly by port in dev — `client/vite.config.ts` proxies `/api` to `http://localhost:4060`, so `App.tsx`'s bare `fetch('/api/members')` calls only work through the Vite dev server or once the server itself serves the built client (it currently does not — `server/src/index.ts` mounts only `membersRouter`, no static file serving).
- `getDb()` (`server/src/db.ts:11`) is a lazy singleton — the first call opens/creates the SQLite file and seeds it if empty. Every route handler calls `getDb()` per-request rather than holding a module-level reference, but they all resolve to the same singleton.
- There is no separate model/service layer — `server/src/routes/members.ts` embeds SQL directly in route handlers.
