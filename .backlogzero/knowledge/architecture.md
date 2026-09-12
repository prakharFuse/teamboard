---
name: architecture
description: How the client, server, and SQLite DB actually talk — read before changing routing, proxying, or the DB entrypoint
type: knowledge
scope: global
updated: 2026-09-12 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/index.ts
  - server/src/db.ts
  - server/src/routes/members.ts
  - client/src/App.tsx
  - client/vite.config.ts
  - package.json
sources_sha256:
  client/src/App.tsx: 50903abfd99acdd441fab7e3084e6e6f1dc989627e78c4d76c0a4bc911639c14
  client/vite.config.ts: 8ce4f4d02ae0440e227419fbeca975395f8a11f6939d20e40f207deb3b6667e6
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/index.ts: 6c2c286cd087d1bbf54d47cbab8b0ee3aa1e86795a2a1a615588e18f9541762b
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

```mermaid
flowchart LR
  subgraph Client["client/ (Vite dev server :5173)"]
    App["App.tsx"]
  end

  subgraph Server["server/ (Express :4060)"]
    Index["index.ts"]
    Members["routes/members.ts"]
    Db["db.ts (getDb)"]
  end

  Sqlite[("data/team.db\n(node:sqlite)")]

  App -- "fetch /api/members* \n(Vite proxy /api -> :4060)" --> Index
  Index -- "app.use('/api/members', router)" --> Members
  Members -- "getDb()" --> Db
  Db -- "DatabaseSync(DB_PATH)" --> Sqlite
```

Client and server are two independent processes started together only via
`concurrently` in `pnpm dev` (`package.json:10`) — there is no shared build, no
SSR, and no direct import between `client/` and `server/`. The only coupling is
the Vite dev-server proxy (`client/vite.config.ts:8-10`) forwarding `/api/*` to
`http://localhost:4060`, and the JSON shapes both sides independently declare
(`Member`/`Stats` in `App.tsx:3-16` vs `MemberRow` in `members.ts:4-14` — these
are not a shared type import, so if one side's columns change the other must be
updated by hand).

`getDb()` (`db.ts:11`) is a lazy singleton: the first caller in the process
creates the file (or `:memory:`), runs `CREATE TABLE IF NOT EXISTS`, and seeds 8
rows if the table was empty. Every route handler calls `getDb()` per-request but
only pays the setup cost once per process.
