---
name: architecture
description: Real request/data flow between the Vite client, Express server, and SQLite file
type: knowledge
scope: global
updated: 2026-09-12 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - client/vite.config.ts
  - server/src/index.ts
  - server/src/db.ts
  - server/src/routes/members.ts
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
  Browser -->|"GET/POST /api/members/*"| ViteDev["Vite dev server :5173\n(client/vite.config.ts)"]
  ViteDev -->|proxy /api -> :4060| Express["Express app :4060\n(server/src/index.ts)"]
  Express --> Router["membersRouter\n(server/src/routes/members.ts)"]
  Router -->|getDb| DB["node:sqlite DatabaseSync\n(server/src/db.ts)"]
  DB --> File["data/team.db\n(gitignored file)"]
```

- The client never talks to the server directly in dev — `vite.config.ts` proxies any `/api` path to `http://localhost:4060`; there's no `VITE_API_URL`-style env indirection.
- `getDb()` in `server/src/db.ts` lazily opens a single module-scoped `DatabaseSync` handle and creates the `members` table + seed rows on first call if the DB is empty — there's no separate migration step or seed script.
- Test code (`server/src/routes/members.test.ts`) redirects the same `getDb()` to an in-memory DB via `TEAMBOARD_DB_PATH=':memory:'`, set as a `process.env` write before the router is imported — it does not spin up a second server process.
