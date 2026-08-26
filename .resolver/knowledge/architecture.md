---
name: architecture
description: Real request/data flow between client, server, and SQLite — read before changing routing, proxying, or DB init
type: knowledge
scope: global
updated: 2026-08-26 (IONE-959)
captured_sha: 40c1af055214b8aac31e85217138b2f00e468ff5
sources:
  - client/vite.config.ts
  - server/src/config.ts
  - server/src/db.ts
  - server/src/index.ts
sources_sha256:
  client/vite.config.ts: 2635b1b0c25f00bcd01ee312a924b22372c08b7e5812f3cf7afa10621acea14b
  server/src/config.ts: 361319784de0ec3fc5b293e6c42a05ed698a2d9f00a1856350b755ca385218be
  server/src/db.ts: 59189dfe1d4fe4a3e3cfa86389b9fbf6445b7270af53a3eec2b390e7635fb4fd
  server/src/index.ts: 8bf1866cdb94244360f9786673869c67dedf3b93aa2c05dbe8aa6b908cb871b5
---

```mermaid
flowchart LR
  Browser -->|"HTTP :5173"| Vite["Vite dev server\n(client/vite.config.ts)"]
  Vite -->|"proxy /api/*\n-> :4060"| Express["Express app\n(server/src/index.ts)"]
  Express --> Router["membersRouter\n(server/src/routes/members.ts)"]
  Router -->|"getDb()"| SQLite["node:sqlite DatabaseSync\n(server/src/db.ts)"]
  SQLite --> File["data/team.db\n(gitignored, auto-created)"]

  Test["members.test.ts"] -->|"in-process app.listen(0)"| RouterTest["membersRouter\n(same module)"]
  RouterTest -->|"getDb()"| MemDB["DatabaseSync ':memory:'\n(TEAMBOARD_DB_PATH env)"]
```

## Non-obvious edges

- The client's dev proxy target is no longer hardcoded: `client/vite.config.ts:7-8` reads
  `TEAMBOARD_HOST`/`TEAMBOARD_PORT` (falling back to legacy `PORT`), mirroring the same
  defaults as `server/src/config.ts`. Overriding those env vars changes both the server's
  listen address and the client's proxy target together — there's no more editing
  `vite.config.ts` and `index.ts` in lockstep to move the port.
- `getDb()` is a lazy singleton (`server/src/db.ts:9,13`) — the DB connection and
  schema/seed creation only happen on the first route handler that calls it, not at
  server startup. Tests exploit this: they set `process.env.TEAMBOARD_DB_PATH` before
  importing/calling the router so the first `getDb()` call binds to `:memory:` instead
  of `data/team.db` (`server/src/routes/members.test.ts:24`).
- The seed data (8 members) is inserted only when the table is empty
  (`server/src/db.ts:30-42`), so it never re-runs against an existing `data/team.db`.
