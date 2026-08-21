---
name: architecture
description: Real component shape of TeamBoard — client, server, and DB, and how they connect
type: knowledge
scope: global
updated: 2026-08-21 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
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
    Browser["Browser\n(client/src/App.tsx)"]
    Vite["Vite dev server\n:5173\n(client/vite.config.ts)"]
    Express["Express API\n:4060\n(server/src/index.ts)"]
    Members["membersRouter\n(server/src/routes/members.ts)"]
    DB[("SQLite\ndata/team.db\nnode:sqlite DatabaseSync")]

    Browser -->|fetch /api/*| Vite
    Vite -->|proxy /api -> localhost:4060| Express
    Express --> Members
    Members -->|parameterized SQL| DB
```

Two independent processes in dev (`pnpm dev` runs both via `concurrently`): Vite only proxies `/api` requests to the Express server, it does not import server code. The Express app mounts the entire members feature — CRUD, `/export`, `/stats` — as one router at `/api/members` (server/src/index.ts:11); there's no other router or service. `getDb()` in server/src/db.ts is a lazy singleton opened on first call, shared by every request in the process — there's no connection pool since `node:sqlite` is synchronous, in-process.
