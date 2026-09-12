---
name: architecture
description: Real request-flow shape of TeamBoard (client → Vite proxy → Express → SQLite)
type: knowledge
scope: global
updated: 2026-09-12 (IONE-959)
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
    Browser["Browser UI\nclient/src/App.tsx"]
    Vite["Vite dev server :5173\n(proxies /api/*)"]
    Express["Express app :4060\nserver/src/index.ts"]
    Router["membersRouter\nserver/src/routes/members.ts"]
    DB["SQLite file\ndata/team.db\nvia server/src/db.ts"]

    Browser -->|fetch('/api/members')| Vite
    Vite -->|proxy /api → :4060| Express
    Express -->|app.use('/api/members', ...)| Router
    Router -->|getDb()| DB
```

- The client never talks to the server directly in dev — `client/vite.config.ts` proxies `/api` to `http://localhost:4060`, so `App.tsx`'s bare `fetch('/api/members')` calls only work through `pnpm dev` (both processes running) or in production behind a reverse proxy that does the same routing.
- `getDb()` is a module-level singleton (`server/src/db.ts:9`) — one `DatabaseSync` connection for the process lifetime, created and seeded lazily on first call.
- There is no separate data-access layer: `members.ts` writes raw SQL directly against the `DatabaseSync` handle returned by `getDb()`.
