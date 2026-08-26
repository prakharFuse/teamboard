---
name: architecture
description: Real request/data flow between client, server, and SQLite — read before changing routing, proxying, or DB init
type: knowledge
scope: global
updated: 2026-08-26 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - client/vite.config.ts
  - server/src/index.ts
  - server/src/routes/members.ts
  - server/src/db.ts
  - server/src/routes/members.test.ts
sources_sha256:
  client/vite.config.ts: 8ce4f4d02ae0440e227419fbeca975395f8a11f6939d20e40f207deb3b6667e6
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/index.ts: 6c2c286cd087d1bbf54d47cbab8b0ee3aa1e86795a2a1a615588e18f9541762b
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
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

- The client never talks to the server directly in dev — everything goes through
  Vite's `/api` proxy (`client/vite.config.ts:8-10`), which hardcodes
  `http://localhost:4060`. There's no env var for this; changing the server port
  requires editing `client/vite.config.ts` and `server/src/index.ts` together.
- `getDb()` is a lazy singleton (`server/src/db.ts:9,12`) — the DB connection and
  schema/seed creation only happen on the first route handler that calls it, not at
  server startup. Tests exploit this: they set `process.env.TEAMBOARD_DB_PATH` before
  importing/calling the router so the first `getDb()` call binds to `:memory:` instead
  of `data/team.db` (`server/src/routes/members.test.ts:24`).
- The seed data (8 members) is inserted only when the table is empty
  (`server/src/db.ts:32-45`), so it never re-runs against an existing `data/team.db`.
