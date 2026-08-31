---
name: architecture
description: Real request path from browser to SQLite, and the dev-only proxy wiring
type: knowledge
scope: global
updated: 2026-08-31 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - client/vite.config.ts
  - server/src/index.ts
  - server/src/routes/members.ts
  - server/src/db.ts
  - package.json
sources_sha256:
  client/vite.config.ts: 8ce4f4d02ae0440e227419fbeca975395f8a11f6939d20e40f207deb3b6667e6
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/index.ts: 6c2c286cd087d1bbf54d47cbab8b0ee3aa1e86795a2a1a615588e18f9541762b
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

```mermaid
flowchart LR
  Browser -->|":5173"| Vite[Vite dev server\nclient/vite.config.ts]
  Vite -->|"proxy /api/*"| Express["Express app :4060\nserver/src/index.ts"]
  Express --> Router["members router\nserver/src/routes/members.ts"]
  Router --> DB[("SQLite\ndata/team.db\nserver/src/db.ts")]
```

`getDb()` in server/src/db.ts is a module-level singleton: the first caller to
invoke it opens the file (or `:memory:`) and runs the `CREATE TABLE IF NOT
EXISTS` + seed insert; every later call reuses that same connection. The
`TEAMBOARD_DB_PATH` env var must be set before that first call — tests rely on
this by setting it at module load time in members.test.ts, before the router
(and its lazy `getDb()` calls) ever runs.

## Gap: no production static-file serving

`pnpm build` (package.json) only compiles `server/tsconfig.build.json` — there
is no equivalent client build step wired into `pnpm build`, and server/src/index.ts
never calls `express.static(...)` to serve a client bundle. The Vite proxy in
client/vite.config.ts only wires `/api` in dev mode. There is currently no path
in this repo that serves the built client in production; `pnpm dev` (client +
server side by side) is the only working end-to-end flow.
