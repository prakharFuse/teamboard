---
name: architecture
description: Real component shape of TeamBoard — client, server, and SQLite, verified from imports and configs
type: knowledge
scope: global
updated: 2026-09-16 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - client/vite.config.ts
  - client/src/main.tsx
  - client/src/App.tsx
  - server/src/index.ts
  - server/src/routes/members.ts
  - server/src/db.ts
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
    subgraph Client["client/ (Vite dev server :5173)"]
        Main["main.tsx"] --> App["App.tsx"]
    end

    subgraph Server["server/ (Express :4060)"]
        Index["index.ts"] -->|mounts /api/members| Members["routes/members.ts"]
        Members -->|getDb| DbMod["db.ts"]
    end

    DbMod -->|node:sqlite| SQLite[("data/team.db")]

    App -- "fetch('/api/members*')\nproxied via vite.config.ts" --> Index
```

- `App.tsx` never imports `db.ts` or any server module directly — the only link between client and server is the HTTP/JSON boundary at `/api/members*`, proxied in dev by `client/vite.config.ts:9`.
- `index.ts` mounts the entire members router at the `/api/members` prefix (`server/src/index.ts:11`); every route inside `members.ts` is defined relative to that prefix.
- `db.ts` is the only file that touches `node:sqlite`; `members.ts` never opens a connection itself, it always goes through `getDb()`.
