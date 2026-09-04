---
name: architecture
description: Real component shape of TeamBoard — client, server, DB, and how they talk
type: knowledge
scope: global
updated: 2026-09-04 (IONE-959)
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
  subgraph Browser
    UI[React App - client/src/App.tsx]
  end
  subgraph "Vite dev server (:5173)"
    Vite[vite.config.ts]
  end
  subgraph "Express API (:4060)"
    Idx[server/src/index.ts]
    Router[members.ts router]
  end
  DB[(SQLite file\ndata/team.db)]

  UI -- "fetch('/api/members', ...)" --> Vite
  Vite -- "proxy /api -> localhost:4060" --> Idx
  Idx -- "app.use('/api/members', membersRouter)" --> Router
  Router -- "getDb() singleton" --> DB
```

- The client never talks to the server directly by hostname/port — all requests are relative (`/api/members`, see `client/src/App.tsx`), and Vite's dev-server proxy (`client/vite.config.ts`) is what routes them to `localhost:4060`. In a non-dev deployment, whatever serves the built client must reproduce that `/api` proxy/rewrite or the app breaks — nothing in the repo currently does this (there's no reverse-proxy config or static-serving code in `server/src/index.ts`).
- `getDb()` (`server/src/db.ts:11`) is a module-level lazy singleton — one process, one `DatabaseSync` connection, created on first call and reused for the process lifetime. Tests rely on this: they set `TEAMBOARD_DB_PATH=':memory:'` before the first request so the singleton is born pointing at an in-memory DB (see [[testing]]).
