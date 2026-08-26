---
name: architecture
description: Real request-flow shape of TeamBoard — client, server, and the SQLite file
type: knowledge
scope: global
updated: 2026-08-26 (IONE-959)
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
    Browser -->|HTTP| ViteDev["Vite dev server :5173\n(client/vite.config.ts)"]
    ViteDev -->|proxy /api/*| Express["Express app :4060\n(server/src/index.ts)"]
    Express --> MembersRouter["membersRouter\n(server/src/routes/members.ts)"]
    MembersRouter -->|node:sqlite| DB[("data/team.db\n(server/src/db.ts)")]
```

- The client never talks to the server directly in dev — `vite.config.ts`
  proxies any `/api` request from `:5173` to `http://localhost:4060`, so
  `client/src/App.tsx` calls relative paths like `fetch('/api/members')`.
- `membersRouter` is mounted once, at `/api/members`, in `server/src/index.ts`;
  all member CRUD, `/export`, and `/stats` are sub-routes of that single
  router file.
- `getDb()` (`server/src/db.ts`) is a lazy module-level singleton — the first
  caller (whichever route handler runs first) creates the file at
  `data/team.db` and seeds it if empty. There is no connection pool; every
  request reuses the same `DatabaseSync` handle.
