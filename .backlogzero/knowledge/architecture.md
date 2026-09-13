---
name: architecture
description: How the client, server, and database actually talk to each other
type: knowledge
scope: global
updated: '2026-09-13'
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - client/vite.config.ts
  - client/src/main.tsx
  - client/src/App.tsx
  - server/src/index.ts
  - server/src/routes/members.ts
  - server/src/db.ts
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
    Browser -->|renders| App["client/src/App.tsx\n(React component)"]
    App -->|"fetch /api/members\n/api/members/stats\n/api/members/:id"| ViteProxy["Vite dev server :5173\nproxy /api → :4060"]
    ViteProxy --> Express["server/src/index.ts\nExpress app :4060"]
    Express -->|"mounted at /api/members"| Router["server/src/routes/members.ts"]
    Router -->|"getDb()"| SQLite["server/src/db.ts\nnode:sqlite DatabaseSync"]
    SQLite --> File["data/team.db\n(gitignored, auto-created)"]
```

- The client never talks to the server directly by URL — it always calls same-origin `/api/...` paths, and Vite's dev proxy (`client/vite.config.ts`) forwards those to `http://localhost:4060`. There's no CORS-relevant client config; `cors()` in `server/src/index.ts:8` is permissive (no origin restriction), which only matters if something calls the API from a non-proxied origin.
- `getDb()` is called per-request inside each route handler (`server/src/routes/members.ts`), not once at startup — the first call creates the file/table/seed data lazily.
- There is one Express router (`membersRouter`) mounted at one path; all member CRUD, `/export`, and `/stats` live in the same file (`server/src/routes/members.ts`), not split into separate route modules.
