---
name: architecture
description: Real runtime shape of the client/server/DB split, derived from imports and configs
type: knowledge
scope: global
updated: '2026-08-21'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - package.json
  - client/vite.config.ts
  - server/src/index.ts
  - server/src/db.ts
  - client/src/App.tsx
sources_sha256:
  client/src/App.tsx: 50903abfd99acdd441fab7e3084e6e6f1dc989627e78c4d76c0a4bc911639c14
  client/vite.config.ts: 8ce4f4d02ae0440e227419fbeca975395f8a11f6939d20e40f207deb3b6667e6
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/index.ts: 6c2c286cd087d1bbf54d47cbab8b0ee3aa1e86795a2a1a615588e18f9541762b
---

```mermaid
flowchart LR
  Browser -->|"fetch /api/*"| ViteDevServer["Vite dev server :5173\n(client/vite.config.ts)"]
  ViteDevServer -->|"proxy /api"| ExpressApp["Express app :4060\n(server/src/index.ts)"]
  ExpressApp --> MembersRouter["membersRouter\n(server/src/routes/members.ts)"]
  MembersRouter --> DB[("SQLite via node:sqlite\ndata/team.db\nserver/src/db.ts")]
```

- `client/vite.config.ts` sets `root: 'client'` and proxies `/api` to `http://localhost:4060`
  — the two processes only talk over HTTP, there's no shared TS import between `client/` and
  `server/` (confirmed: no cross-directory imports in either `tsconfig.json`).
- `server/src/index.ts` mounts a single router (`membersRouter`) at `/api/members`; all
  business logic lives in that one file (`server/src/routes/members.ts`).
- `db.ts` lazily opens the SQLite connection on first `getDb()` call and seeds 8 rows if the
  table is empty — there is no separate migration step or seed script.
