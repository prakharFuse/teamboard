---
name: architecture
description: How the client, API, and database actually connect — request flow diagram
type: knowledge
scope: global
updated: 2026-08-14 (IONE-959)
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
  Browser -->|"fetch('/api/members', ...)"| ViteProxy["Vite dev server\n(port 5173)"]
  ViteProxy -->|"proxy /api/*"| Express["Express app\nserver/src/index.ts\n(port 4060)"]
  Express --> Router["membersRouter\nserver/src/routes/members.ts"]
  Router -->|"getDb()"| DB["node:sqlite DatabaseSync\nserver/src/db.ts"]
  DB --> File["data/team.db\n(gitignored, created on first run)"]
```

Notes:
- The client (`client/src/App.tsx`) talks to the API only through relative `/api/*` fetches — in dev, `client/vite.config.ts` proxies those to `http://localhost:4060`; in production there is no proxy config, so the client must be served behind something that routes `/api` to the Express process.
- `getDb()` (`server/src/db.ts:11`) is a lazy singleton: the first request in the process opens/creates the SQLite file, runs the DDL, and seeds 8 rows if the table is empty. Every route handler calls `getDb()` per-request rather than holding a module-level reference.
- There is one router (`membersRouter`) mounted at `/api/members`; no other API surface exists.
