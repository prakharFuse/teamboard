---
name: architecture
description: Real component shape of TeamBoard (client, server, DB) and how they talk — read before touching app wiring
type: knowledge
scope: global
updated: 2026-08-21 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - package.json
  - server/src/index.ts
  - client/vite.config.ts
  - server/src/db.ts
sources_sha256:
  client/vite.config.ts: 8ce4f4d02ae0440e227419fbeca975395f8a11f6939d20e40f207deb3b6667e6
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/index.ts: 6c2c286cd087d1bbf54d47cbab8b0ee3aa1e86795a2a1a615588e18f9541762b
---

```mermaid
flowchart LR
    Browser -->|"/ (dev, port 5173)"| Vite[Vite dev server\nclient/src]
    Vite -->|proxy /api/*| Express[Express app\nserver/src/index.ts\nport 4060]
    Express --> Members[membersRouter\nserver/src/routes/members.ts]
    Members -->|node:sqlite DatabaseSync| DB[(SQLite file\ndata/team.db)]
```

- The client never talks to the server directly in dev — Vite's `server.proxy` (client/vite.config.ts:8-10) forwards `/api` to `http://localhost:4060`. In production (`pnpm start`), Express serves only the API; there's no static-file serving of the built client in server/src/index.ts.
- `getDb()` (server/src/db.ts:11) is a lazy singleton — the DB connection and schema/seed creation happen on first call, not at server startup.
- There is only one API module (`membersRouter`); it's mounted at `/api/members` in server/src/index.ts:11.
