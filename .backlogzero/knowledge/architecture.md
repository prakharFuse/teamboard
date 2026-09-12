---
name: architecture
description: How client, server, and the SQLite DB actually talk — read before touching request flow or ports
type: knowledge
scope: global
updated: 2026-09-12 (IONE-959)
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
    Browser -->|HTTP :5173| ViteDev[Vite dev server\nclient/vite.config.ts]
    ViteDev -->|serves| AppTsx[client/src/App.tsx]
    AppTsx -->|fetch /api/members*| Proxy["/api proxy\n→ localhost:4060"]
    Proxy --> ExpressApp[Express app\nserver/src/index.ts]
    ExpressApp -->|mounted at /api/members| MembersRouter[members router\nserver/src/routes/members.ts]
    MembersRouter -->|getDb| SqliteFile[(SQLite file\ndata/team.db)]
```

- The client never calls the server directly by port in dev — it fetches relative `/api/...` paths, and Vite's dev-server proxy (`client/vite.config.ts:8-10`) forwards those to `http://localhost:4060`. In production there is no proxy config, so the client would need to be served behind something that does this forwarding (not present in this repo).
- `pnpm dev` runs both processes concurrently (`concurrently` in `package.json`) — server via `node --watch dist/server/index.js`, client via `vite`. The server must be built once (`pnpm build`) before `dev:server` has a `dist/server/index.js` to watch.
- All member routes live in one router file and share the single `getDb()` handle — there is no service layer or ORM between routes and raw SQL.
