---
name: architecture
description: How the client, server, and database actually talk to each other
type: knowledge
scope: global
updated: 2026-08-17 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - package.json
  - client/vite.config.ts
  - server/src/index.ts
  - server/src/db.ts
  - server/src/routes/members.ts
sources_sha256:
  client/vite.config.ts: 8ce4f4d02ae0440e227419fbeca975395f8a11f6939d20e40f207deb3b6667e6
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/index.ts: 6c2c286cd087d1bbf54d47cbab8b0ee3aa1e86795a2a1a615588e18f9541762b
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

Layout and stack are correctly described in ../../CLAUDE.md and ../../README.md — see those for the file map and command list.

```mermaid
flowchart LR
  Browser -->|fetch /api/*| ViteDevServer["Vite dev server :5173\n(client/vite.config.ts)"]
  ViteDevServer -->|proxy /api -> :4060| ExpressApp["Express app :4060\n(server/src/index.ts)"]
  ExpressApp -->|mounts /api/members| MembersRouter["membersRouter\n(server/src/routes/members.ts)"]
  MembersRouter -->|getDb()| SQLite["node:sqlite DatabaseSync\n(server/src/db.ts)"]
  SQLite --> File["data/team.db (gitignored)"]
```

- The client never talks to Express directly in dev — Vite's `server.proxy` (client/vite.config.ts:8-10) forwards `/api` to `http://localhost:4060`. In production there is no static-file serving wired up in `server/src/index.ts`; the server only exposes the JSON API.
- `getDb()` (server/src/db.ts:11) is a lazy singleton — the first caller in the process creates the file and seeds it if empty. Tests override the path via `TEAMBOARD_DB_PATH=':memory:'` before the first call so no test touches `data/team.db`.
