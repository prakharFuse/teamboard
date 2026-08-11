---
name: architecture
description: Real request flow between the Vite client, Express API, and SQLite — read before touching routing or the dev proxy
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
    Browser -->|fetch /api/*| ViteDevServer["Vite dev server :5173"]
    ViteDevServer -->|proxy /api -> :4060| ExpressApp["Express app :4060\n(server/src/index.ts)"]
    ExpressApp --> MembersRouter["membersRouter\n(server/src/routes/members.ts)"]
    MembersRouter -->|getDb()| SQLite["node:sqlite DatabaseSync\n(server/src/db.ts)"]
    SQLite --> DBFile["data/team.db\n(or :memory: in tests)"]
```

- The client never talks to the server directly in dev — `client/vite.config.ts` proxies `/api` to `http://localhost:4060`. In production there's no built-in proxy or static-file serving in `server/src/index.ts`; the client bundle isn't served by Express at all. If you add a `pnpm build`/deploy step for the client, you'll need to wire that serving path yourself — it doesn't exist yet.
- `membersRouter` is mounted once at `/api/members` (`server/src/index.ts:11`) and owns every member-related route, including `/export` and `/stats` — there's no separate stats or export module.
- `getDb()` is a lazy singleton (`server/src/db.ts:9`) — the first call creates the file/table/seed rows; every route handler calls `getDb()` again but gets the same in-process connection. There's no connection pool or per-request handle.
