---
name: architecture
description: Real request flow from browser to SQLite — read before touching routing, proxying, or the DB singleton
type: knowledge
scope: global
updated: 2026-08-31 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - client/vite.config.ts
  - client/src/main.tsx
  - server/src/index.ts
  - server/src/routes/members.ts
  - server/src/db.ts
sources_sha256:
  client/src/main.tsx: 43bca2041adf74102d05394db4bc1a0ac81efe386d9bca960d06b2410f5f94c6
  client/vite.config.ts: 8ce4f4d02ae0440e227419fbeca975395f8a11f6939d20e40f207deb3b6667e6
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/index.ts: 6c2c286cd087d1bbf54d47cbab8b0ee3aa1e86795a2a1a615588e18f9541762b
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

```mermaid
flowchart LR
  Browser -->|":5173 dev"| Vite[Vite dev server]
  Vite -->|"proxy /api/*"| Express["Express app (index.ts) :4060"]
  Express --> MembersRouter["membersRouter (/api/members)"]
  MembersRouter --> DB[("SQLite\ndata/team.db\nvia getDb()")]
```

- `client/vite.config.ts` is the only thing that wires client and server together at dev time — the proxy rule (`'/api': 'http://localhost:4060'`) is what makes relative `fetch('/api/members')` calls in `App.tsx` work. There's no such wiring in production (see [[overview]]).
- `getDb()` in `server/src/db.ts` is a lazy module-level singleton: the first call opens the file (or `:memory:` if `TEAMBOARD_DB_PATH` is set), creates the table if missing, and seeds 8 rows if the table is empty. Every subsequent call returns the same `DatabaseSync` handle. Route handlers never close it.
- All five CRUD verbs plus `/export` and `/stats` live in the single `membersRouter` (`server/src/routes/members.ts`) — there's no controller/service split.
