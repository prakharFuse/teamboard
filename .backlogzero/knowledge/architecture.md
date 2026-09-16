---
name: architecture
description: How the client, server, and SQLite DB fit together — component diagram
type: knowledge
scope: global
updated: 2026-09-16 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/index.ts
  - server/src/routes/members.ts
  - server/src/db.ts
  - client/src/App.tsx
  - client/src/main.tsx
  - client/vite.config.ts
sources_sha256:
  client/src/App.tsx: 50903abfd99acdd441fab7e3084e6e6f1dc989627e78c4d76c0a4bc911639c14
  client/src/main.tsx: 43bca2041adf74102d05394db4bc1a0ac81efe386d9bca960d06b2410f5f94c6
  client/vite.config.ts: 8ce4f4d02ae0440e227419fbeca975395f8a11f6939d20e40f207deb3b6667e6
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/index.ts: 6c2c286cd087d1bbf54d47cbab8b0ee3aa1e86795a2a1a615588e18f9541762b
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

```mermaid
flowchart LR
  subgraph Client["client (Vite dev server :5173)"]
    main[main.tsx] --> App[App.tsx]
  end

  subgraph Server["server (Express :4060)"]
    index[index.ts] --> membersRouter[routes/members.ts]
    membersRouter --> db[db.ts: getDb]
  end

  DB[(data/team.db\nSQLite via node:sqlite)]

  App -- "fetch /api/members\n/api/members/stats\n/api/members/:id (POST/PATCH/DELETE)" --> index
  index -- "vite proxy /api -> :4060" --> membersRouter
  db --> DB
```

- The client never talks to SQLite directly; all reads/writes go through the `/api/members*` routes in `server/src/routes/members.ts`.
- `getDb()` is the single entry point for DB access and lazily creates+seeds the SQLite file on first call (`server/src/db.ts:11-48`) — there is no separate migration step or seed script.
- The Vite proxy (`client/vite.config.ts:8-10`) is dev-only; in production the client build would need to be served behind the same origin as the API or the proxy target reconfigured.
