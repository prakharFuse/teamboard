---
name: architecture
description: Real request flow between client, server, and SQLite — read before touching cross-cutting behavior
type: knowledge
scope: global
updated: 2026-08-26 (IONE-959)
captured_sha: 9751dd9cba13495abfa900c0f23381a2060fae7c
sources:
  - client/vite.config.ts
  - server/src/index.ts
  - server/src/routes/members.ts
  - server/src/db.ts
sources_sha256:
  client/vite.config.ts: 8ce4f4d02ae0440e227419fbeca975395f8a11f6939d20e40f207deb3b6667e6
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/index.ts: 6c2c286cd087d1bbf54d47cbab8b0ee3aa1e86795a2a1a615588e18f9541762b
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

```mermaid
graph LR
  Client["client/src/App.tsx (React, Vite dev :5173)"] -->|"fetch /api/members* (Vite proxy)"| Server["server/src/index.ts (Express :4060)"]
  Server -->|"mounted at /api/members"| Router["server/src/routes/members.ts"]
  Router -->|"getDb()"| DbMod["server/src/db.ts"]
  DbMod --> Sqlite[("data/team.db\n(node:sqlite, or :memory: in tests)")]
```

- The client never talks to the server on a different origin in dev: Vite's
  dev server proxies any `/api` path to `http://localhost:4060`
  (`client/vite.config.ts:8-10`), so `App.tsx` just calls relative paths like
  `fetch('/api/members')`.
- `server/src/index.ts` is the only Express entrypoint; it mounts
  `membersRouter` once, at `/api/members`. There is no other router or
  middleware layer beyond `cors()` and `express.json()`.
- `getDb()` is a lazy singleton (module-level `db` variable) — the first
  caller in a process pays the cost of creating the file/dir and seeding
  data; every route handler calls `getDb()` per-request rather than holding
  a reference.

See [[data-model]] for the schema and [[gotchas]] for the seed/singleton
caveats.
