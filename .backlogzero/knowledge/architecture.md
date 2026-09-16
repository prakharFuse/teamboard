---
name: architecture
description: Client/server/DB shape and request flow — read when tracing how a request reaches the database
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
  - package.json
sources_sha256:
  client/src/App.tsx: 50903abfd99acdd441fab7e3084e6e6f1dc989627e78c4d76c0a4bc911639c14
  client/src/main.tsx: 43bca2041adf74102d05394db4bc1a0ac81efe386d9bca960d06b2410f5f94c6
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/index.ts: 6c2c286cd087d1bbf54d47cbab8b0ee3aa1e86795a2a1a615588e18f9541762b
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

```mermaid
flowchart LR
  Browser["Browser<br/>(React app)"] -->|"fetch /api/members*<br/>(Vite dev-server proxy, port 5173)"| Express
  subgraph Server["server (Express, port 4060)"]
    Express["index.ts<br/>app.use(cors, json)"] --> Router["routes/members.ts<br/>Router"]
    Router --> Db["db.ts<br/>getDb()"]
  end
  Db -->|"node:sqlite"| SQLite[("data/team.db<br/>(gitignored)")]
```

- `client/src/App.tsx` calls `fetch('/api/members')`, `/api/members/stats`, and posts/deletes to `/api/members` and `/api/members/:id`. There is no separate API client module — all fetch calls live directly in `App.tsx`'s handlers (`loadMembers`, `loadStats`, `addMember`, `removeMember`).
- `client/vite.config.ts` proxies `/api` to the server during `pnpm dev:client`; in production the client would need to be served behind the same origin as the Express app (no such serving path exists yet — `index.ts` only mounts the API router, it does not serve `client/dist`).
- `getDb()` (`server/src/db.ts:11`) is a lazy singleton: the first call opens/creates the SQLite file (or `:memory:` for tests) and seeds it if empty. Every route handler calls `getDb()` per-request rather than importing a shared instance.
