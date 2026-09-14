---
name: architecture
description: How the client, server, and SQLite DB are wired together at runtime
type: knowledge
scope: global
updated: 2026-09-14 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/index.ts
  - server/src/routes/members.ts
  - server/src/db.ts
  - client/src/App.tsx
  - client/src/main.tsx
  - client/vite.config.ts
  - package.json
sources_sha256:
  client/src/App.tsx: 50903abfd99acdd441fab7e3084e6e6f1dc989627e78c4d76c0a4bc911639c14
  client/src/main.tsx: 43bca2041adf74102d05394db4bc1a0ac81efe386d9bca960d06b2410f5f94c6
  client/vite.config.ts: 8ce4f4d02ae0440e227419fbeca975395f8a11f6939d20e40f207deb3b6667e6
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/index.ts: 6c2c286cd087d1bbf54d47cbab8b0ee3aa1e86795a2a1a615588e18f9541762b
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

```mermaid
flowchart LR
    subgraph Client["client/ (Vite dev server :5173)"]
        App["App.tsx"] -->|fetch /api/members*| Proxy
    end

    Proxy["Vite proxy\n/api → :4060"]

    subgraph Server["server/ (Express :4060)"]
        Index["index.ts\napp.listen"] --> Router["routes/members.ts\nRouter"]
        Router --> DbMod["db.ts\ngetDb()"]
    end

    DbMod --> SQLite[("data/team.db\n(node:sqlite)")]
    Proxy --> Index
```

- The client never talks to the server directly in dev — `client/vite.config.ts:8` proxies `/api` to `http://localhost:4060`, so `App.tsx` always calls relative paths like `/api/members`. There is no `VITE_API_URL` or similar env indirection.
- `server/src/index.ts:11` mounts the entire members router at `/api/members`; every route in `members.ts` is relative to that prefix (e.g. the handler at `members.ts:48` is `GET /api/members/export`, not `/api/export`).
- `db.ts:11` (`getDb`) is a lazy singleton: the first caller (whichever route handler runs first) triggers table creation and seeding. There is no separate migration/seed script — schema and seed data live inline in `getDb`.
- Route ordering in `members.ts` matters: `/export` (`members.ts:48`) and `/stats` (`members.ts:60`) are registered before the `/:id` (`members.ts:71`) catch-all, which is required for Express to route `GET /api/members/export` correctly instead of matching `:id="export"`. Keep this order if adding new fixed sub-paths.
