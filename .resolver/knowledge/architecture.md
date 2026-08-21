---
name: architecture
description: Real component shape of TeamBoard (client, server, DB) and how they talk
type: knowledge
scope: global
updated: 2026-08-21 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - package.json
  - client/vite.config.ts
  - server/src/index.ts
  - server/src/routes/members.ts
  - server/src/db.ts
sources_sha256:
  client/vite.config.ts: 8ce4f4d02ae0440e227419fbeca975395f8a11f6939d20e40f207deb3b6667e6
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/index.ts: 6c2c286cd087d1bbf54d47cbab8b0ee3aa1e86795a2a1a615588e18f9541762b
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

```mermaid
flowchart LR
  Browser -->|fetch /api/*| ViteDevServer["Vite dev server (:5173)\nclient/src/App.tsx"]
  ViteDevServer -->|proxy /api| ExpressApp["Express app (:4060)\nserver/src/index.ts"]
  ExpressApp --> MembersRouter["membersRouter\nserver/src/routes/members.ts"]
  MembersRouter --> SQLite["node:sqlite DatabaseSync\ndata/team.db\nserver/src/db.ts"]
```

- Single-page React app with no client-side router or state library — all
  state lives in `App.tsx`'s `useState`/`useEffect` hooks.
- `membersRouter` is mounted once, at `/api/members` (`server/src/index.ts:11`);
  there is no other router or module in the server.
- `getDb()` (`server/src/db.ts`) is a lazy singleton — the first caller in the
  process creates the file (or `:memory:` DB) and seeds it; every route
  handler shares that one connection.
