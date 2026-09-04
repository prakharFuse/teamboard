---
name: architecture
description: Real shape of client/server/db and how requests flow — read before touching routing, proxying, or the DB layer
type: knowledge
scope: global
updated: '2026-09-04'
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
    Browser -->|"GET /"| Vite["Vite dev server\n(client/, port 5173)"]
    Browser -->|"fetch('/api/...')"| Vite
    Vite -->|proxy /api/*| Express["Express app\n(server/src/index.ts, port 4060)"]
    Express --> Router["membersRouter\n(server/src/routes/members.ts)"]
    Router -->|getDb()| DB["DatabaseSync\n(server/src/db.ts)"]
    DB --> SQLite[("data/team.db\n(gitignored, file-based)")]
```

- The client never talks to the server on a different origin in dev: `client/vite.config.ts:9` proxies `/api` to `http://localhost:4060`, and `client/src/App.tsx` calls relative paths (`fetch('/api/members')`) — so client and server must be run together (`pnpm dev`, which runs both via `concurrently`) for the proxy to work.
- `server/src/index.ts:8` applies `cors()` globally even though the dev flow relies on the Vite proxy rather than CORS — this only matters if the client is ever served from a different origin than the proxy assumes.
- There is no queue, cache, or second service — `membersRouter` is the only router mounted in `server/src/index.ts:11`, and all reads/writes go straight through `getDb()` to the single SQLite file.
