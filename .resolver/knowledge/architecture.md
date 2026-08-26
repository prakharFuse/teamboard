---
name: architecture
description: How the client, server, and DB actually wire together (ports, proxy, module boundary)
type: knowledge
scope: global
updated: 2026-08-26 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/index.ts
  - client/vite.config.ts
  - server/src/routes/members.ts
  - server/src/db.ts
  - client/src/App.tsx
sources_sha256:
  client/src/App.tsx: 50903abfd99acdd441fab7e3084e6e6f1dc989627e78c4d76c0a4bc911639c14
  client/vite.config.ts: 8ce4f4d02ae0440e227419fbeca975395f8a11f6939d20e40f207deb3b6667e6
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/index.ts: 6c2c286cd087d1bbf54d47cbab8b0ee3aa1e86795a2a1a615588e18f9541762b
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

```mermaid
flowchart LR
    subgraph Client["client (Vite, :5173)"]
        App["App.tsx"]
    end
    subgraph Server["server (Express, :4060)"]
        Index["index.ts"]
        Router["routes/members.ts"]
        Db["db.ts (getDb)"]
    end
    Sqlite[("data/team.db\n(node:sqlite)")]

    App -- "fetch /api/members\nfetch /api/members/stats\n(proxied)" --> Index
    Index -- "app.use('/api/members', membersRouter)" --> Router
    Router -- "getDb()" --> Db
    Db -- "DatabaseSync" --> Sqlite
```

- The client never talks to the server on its own port directly in dev — Vite's dev-server proxy (`client/vite.config.ts`) forwards any `/api` request from `:5173` to `:4060`. There's no build-time env var for the API base URL; if the proxy config changes, `App.tsx`'s bare `fetch('/api/...')` calls break.
- `db.ts`'s `getDb()` is a lazy singleton (`let db: DatabaseSync`) — the whole process shares one connection, created on the first call. This is why tests must set `TEAMBOARD_DB_PATH` before any handler runs (see [[testing]]).
- There is no service boundary beyond client/server — `routes/members.ts` is the only router, mounted once at `/api/members` in `index.ts`.
