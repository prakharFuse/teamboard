---
name: architecture
description: System shape — client/server/DB and how they connect
type: knowledge
scope: global
updated: 2026-09-12 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/index.ts
  - server/src/routes/members.ts
  - server/src/db.ts
  - client/src/App.tsx
  - client/vite.config.ts
sources_sha256:
  client/src/App.tsx: 50903abfd99acdd441fab7e3084e6e6f1dc989627e78c4d76c0a4bc911639c14
  client/vite.config.ts: 8ce4f4d02ae0440e227419fbeca975395f8a11f6939d20e40f207deb3b6667e6
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/index.ts: 6c2c286cd087d1bbf54d47cbab8b0ee3aa1e86795a2a1a615588e18f9541762b
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

```mermaid
flowchart LR
  Browser["React SPA\n(client/src/App.tsx)"]
  Vite["Vite dev server\n:5173"]
  Express["Express API\n(server/src/index.ts)\n:4060"]
  Members["members router\n(server/src/routes/members.ts)"]
  DB["SQLite\ndata/team.db\n(server/src/db.ts)"]

  Browser -- "fetch('/api/...')" --> Vite
  Vite -- "proxy /api" --> Express
  Express -- "app.use('/api/members', ...)" --> Members
  Members -- "prepare/run/get/all" --> DB
```

Single process pairs: one Express app (`server/src/index.ts`) mounting one router (`members.ts`) against one lazily-initialized `DatabaseSync` singleton (`getDb()` in `db.ts`). There is no service boundary beyond client vs. server — everything server-side shares the one module-level `db` variable, so tests must swap `TEAMBOARD_DB_PATH` to `:memory:` **before** the first `getDb()` call (see `../conventions/testing.md`).
