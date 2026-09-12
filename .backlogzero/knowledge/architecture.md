---
name: architecture
description: Real component shape and request flow — read before touching client/server wiring or ports
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
    Browser -->|HTTP :5173| ViteDevServer["Vite dev server (client/)"]
    ViteDevServer -->|proxy /api → :4060| ExpressApp["Express app (server/src/index.ts)"]
    ExpressApp --> MembersRouter["membersRouter (server/src/routes/members.ts)"]
    MembersRouter --> DbModule["getDb() (server/src/db.ts)"]
    DbModule --> SqliteFile["data/team.db (node:sqlite)"]
```

- The client never talks to the server directly in dev — Vite's `server.proxy` config (`client/vite.config.ts`) forwards any `/api/*` request to `http://localhost:4060`. There's no proxy config for a built/production client; see [[overview]] for the missing build step.
- `server/src/index.ts` mounts the entire members feature as one router at `/api/members`; there is only one route module in this repo.
- `getDb()` is a lazy singleton (module-level `db` variable) — the SQLite file/connection is created on first call, not at server startup. Tests override this via `TEAMBOARD_DB_PATH=':memory:'`, set as an env var before the first request (see [[testing]]).
