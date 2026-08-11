---
name: architecture
description: How the client, server, and SQLite DB actually talk — verified from entrypoints and imports
type: knowledge
scope: global
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/index.ts
  - server/src/routes/members.ts
  - server/src/db.ts
  - client/src/App.tsx
  - client/vite.config.ts
---

```mermaid
flowchart LR
    Browser["Browser<br/>client/src/App.tsx"] -->|"fetch /api/members*<br/>(vite proxy → :4060)"| Express["Express app<br/>server/src/index.ts"]
    Express --> Router["membersRouter<br/>server/src/routes/members.ts"]
    Router -->|"getDb()"| DB["DatabaseSync<br/>server/src/db.ts"]
    DB -->|"file"| SQLite[("data/team.db")]
```

- The client never talks to the DB directly and has no server-side rendering — it's a single Vite SPA (`client/src/App.tsx`) doing `fetch()` against relative `/api/*` paths. In dev, `client/vite.config.ts:7-10` proxies `/api` to `http://localhost:4060`; in prod there's no proxy config, so the compiled server must serve on the same origin the client is loaded from (or a reverse proxy in front of both) — the repo has no such prod-serving code today.
- `getDb()` (`server/src/db.ts:11`) is a lazy singleton: the first call opens/creates the SQLite file and seeds it if empty. `TEAMBOARD_DB_PATH=:memory:` swaps this for an ephemeral DB — used by `server/src/routes/members.test.ts` so tests never touch `data/team.db`.
- There is exactly one router (`membersRouter`) mounted at `/api/members`; all seven endpoints live in one file.
