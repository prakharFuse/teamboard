---
name: architecture
description: Real shape of the client/server/db system — read before touching wiring between them
type: knowledge
scope: global
updated: '2026-08-26'
captured_sha: 221c3c38dc1464695c6402832dc7657e83d6d2a0
sources:
  - client/vite.config.ts
  - server/src/index.ts
  - server/src/db.ts
  - package.json
sources_sha256:
  client/vite.config.ts: 8ce4f4d02ae0440e227419fbeca975395f8a11f6939d20e40f207deb3b6667e6
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/index.ts: 6c2c286cd087d1bbf54d47cbab8b0ee3aa1e86795a2a1a615588e18f9541762b
---

```mermaid
graph LR
  subgraph Client
    A[React app<br/>client/src/App.tsx<br/>vite dev :5173]
  end
  subgraph Server
    B[Express app<br/>server/src/index.ts<br/>:4060]
    R[members router<br/>server/src/routes/members.ts]
  end
  D[(SQLite file<br/>data/team.db<br/>server/src/db.ts)]

  A -- "fetch /api/members/*\n(vite proxy)" --> B
  B -- mounts --> R
  R -- getDb() --> D
```

- The client never talks to the server's port directly in dev — Vite proxies
  any `/api` request to `http://localhost:4060` (`client/vite.config.ts:9`).
  In production there is no proxy config; the client build must be served
  behind something that forwards `/api` to the Express process.
- `server/src/index.ts` mounts the entire members router at `/api/members`
  (`app.use('/api/members', membersRouter)`), so every path in
  `members.ts` is relative to that prefix.
- There is exactly one router (`members`) and one table (`members`) — no
  other domain modules exist yet.
