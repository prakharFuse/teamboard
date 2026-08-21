---
name: architecture
description: Real request path from browser through Vite proxy to Express and SQLite
type: knowledge
scope: global
updated: 2026-08-21 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - client/vite.config.ts
  - server/src/index.ts
  - server/src/routes/members.ts
  - server/src/db.ts
  - package.json
sources_sha256:
  client/vite.config.ts: 8ce4f4d02ae0440e227419fbeca975395f8a11f6939d20e40f207deb3b6667e6
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/index.ts: 6c2c286cd087d1bbf54d47cbab8b0ee3aa1e86795a2a1a615588e18f9541762b
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

Layout and endpoints are already documented in `../../CLAUDE.md` and `../../README.md` — see those for the file map and the API table.

```mermaid
flowchart LR
  Browser -->|":5173"| Vite[Vite dev server\nclient/vite.config.ts]
  Vite -->|"proxy /api -> :4060"| Express[Express app\nserver/src/index.ts]
  Express --> MembersRouter[members router\nserver/src/routes/members.ts]
  MembersRouter --> SQLite[(SQLite\ndata/team.db)]
```

Non-obvious edges:
- The client never talks to port 4060 directly — it always calls relative `/api/...` paths (`client/src/App.tsx`), and only the Vite dev proxy (`client/vite.config.ts`) routes those to the Express server. There's no `VITE_API_URL`-style env override.
- There is a single Express app with one mounted router (`/api/members`); no other services or processes are involved.
- `getDb()` in `server/src/db.ts` is a lazy singleton — the DB file/connection is created on first request, not at server startup.
