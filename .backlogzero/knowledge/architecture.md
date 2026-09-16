---
name: architecture
description: Runtime shape of client, server, and DB, and how they connect
type: knowledge
scope: global
updated: 2026-09-16 (IONE-959)
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
  Browser -->|"/ (static + HMR)"| Vite["Vite dev server :5173\nclient/src/App.tsx"]
  Vite -->|"proxy /api/*"| Express["Express app :4060\nserver/src/index.ts"]
  Express --> Router["membersRouter\nserver/src/routes/members.ts"]
  Router -->|node:sqlite| DB["data/team.db\n(gitignored, auto-seeded)"]
```

- The client never talks to the server directly in dev — Vite's `server.proxy` (`client/vite.config.ts:8-10`) forwards `/api/*` to `http://localhost:4060`, so both processes must be running (`pnpm dev` starts both via `concurrently`).
- `getDb()` (`server/src/db.ts:11`) is a lazy module-level singleton: the first caller opens/creates `data/team.db` and seeds it if empty. There is no separate migration step or seed script.
- The whole API surface is one router (`membersRouter`) mounted at `/api/members` — no other routers or services exist.
