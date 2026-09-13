---
name: architecture
description: Real request flow between client, server, and SQLite — read before touching routing or the DB layer
type: knowledge
scope: global
updated: 2026-09-13 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
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
flowchart LR
  Browser -->|"HTTP :5173"| ViteDevServer["Vite dev server\n(client/vite.config.ts)"]
  ViteDevServer -->|proxy /api/*| ExpressApp
  Browser -->|"prod: direct fetch('/api/...')"| ExpressApp

  subgraph Server["server/src"]
    ExpressApp["index.ts\nexpress app :4060"] --> MembersRouter["routes/members.ts\n/api/members router"]
    MembersRouter --> GetDb["db.ts getDb()"]
  end

  GetDb --> SQLiteFile[("data/team.db\n(node:sqlite)")]
  GetDb -.test env.-> InMemory[(":memory:"\nTEAMBOARD_DB_PATH)]
```

Notes on the non-obvious edges:
- `getDb()` (`server/src/db.ts:11`) memoizes the `DatabaseSync` handle in a
  module-level `let db` — the first call wins. Tests rely on this: they must
  set `process.env.TEAMBOARD_DB_PATH = ':memory:'` before any handler runs
  `getDb()` for the first time, or they'll open the real `data/team.db` file
  instead (see `server/src/routes/members.test.ts:24`).
- There is no shared client/server package or type import — `Member` in
  `client/src/App.tsx:3` and `MemberRow` in `server/src/routes/members.ts:4`
  are hand-duplicated interfaces. Changing the DB schema means updating both
  by hand; nothing enforces they stay in sync.
- `index.ts` only mounts `/api/members`; it does not serve the built client,
  so `pnpm start` alone will not serve the UI — `pnpm dev` runs both via
  `concurrently` (see `package.json` scripts).
