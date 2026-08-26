---
name: architecture
description: Real client/server/DB call graph for TeamBoard — read before changing how the pieces talk
type: knowledge
scope: global
updated: 2026-08-26 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - client/src/App.tsx
  - client/vite.config.ts
  - server/src/index.ts
  - server/src/routes/members.ts
  - server/src/db.ts
sources_sha256:
  client/src/App.tsx: 50903abfd99acdd441fab7e3084e6e6f1dc989627e78c4d76c0a4bc911639c14
  client/vite.config.ts: 8ce4f4d02ae0440e227419fbeca975395f8a11f6939d20e40f207deb3b6667e6
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/index.ts: 6c2c286cd087d1bbf54d47cbab8b0ee3aa1e86795a2a1a615588e18f9541762b
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

```mermaid
flowchart LR
  Browser["Browser (client/src/App.tsx)"]
  Vite["Vite dev server :5173\n(client/vite.config.ts)"]
  Express["Express app :4060\n(server/src/index.ts)"]
  Router["membersRouter\n(server/src/routes/members.ts)"]
  DB["SQLite file data/team.db\n(server/src/db.ts getDb())"]

  Browser -->|"fetch /api/members, /api/members/stats, /api/members/:id, /api/members/export"| Vite
  Vite -->|"proxy /api/* -> http://localhost:4060"| Express
  Express -->|"app.use('/api/members', membersRouter)"| Router
  Router -->|"db.prepare(...).run/get/all"| DB
```

There is no build-time coupling between `client/` and `server/` — they only talk over HTTP through the Vite dev proxy (`client/vite.config.ts:9`). In production (`pnpm start`), the compiled server serves only the API; there's no static-file serving of the client bundle wired into `server/src/index.ts`, so a real deployment needs a separate step to serve `client`'s built assets (not present in this repo today).
