---
name: architecture
description: How the client, server, and SQLite DB fit together and talk to each other
type: knowledge
scope: global
updated: 2026-08-21 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
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

Layout and commands are covered in ../../CLAUDE.md and ../../README.md — see those for the file tree and script list.

```mermaid
flowchart LR
  Browser -->|"fetch /api/*"| Vite["Vite dev server :5173\n(client/vite.config.ts)"]
  Vite -->|"proxy /api -> :4060"| Express["Express app :4060\n(server/src/index.ts)"]
  Express --> Router["membersRouter\nserver/src/routes/members.ts"]
  Router --> DB[("SQLite\ndata/team.db\nvia node:sqlite DatabaseSync")]
```

Non-obvious edges:
- The client never talks to the server directly in dev — Vite's `server.proxy` (client/vite.config.ts:8-10) forwards `/api` to `http://localhost:4060`, so the server must be running on port 4060 for `pnpm dev:client` to work standalone.
- `getDb()` (server/src/db.ts) is a lazy singleton: the file/table is created and seeded on first call, not at process start. Tests override this via `TEAMBOARD_DB_PATH=':memory:'`, set as an env var before importing the router.
- There is no separate build step wiring client and server together — in production `pnpm build` only compiles the server (`tsc -p server/tsconfig.build.json`); the client is served by Vite in dev and isn't part of `pnpm start`.
