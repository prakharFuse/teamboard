---
name: overview
description: What TeamBoard is, tech stack, and where to find setup/API docs
type: knowledge
scope: global
updated: 2026-09-13 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - package.json
  - README.md
  - server/src/index.ts
  - client/src/main.tsx
sources_sha256:
  README.md: 3d21bbec3cdd5901a9448358c7af568506285536850ff6d875c57a6e9c38cb23
  client/src/main.tsx: 43bca2041adf74102d05394db4bc1a0ac81efe386d9bca960d06b2410f5f94c6
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/index.ts: 6c2c286cd087d1bbf54d47cbab8b0ee3aa1e86795a2a1a615588e18f9541762b
---

TeamBoard is an internal team directory: manage team member profiles (name,
email, role, department, start date) with department stats and a CSV export
for HR. See `README.md` for the full API table, getting-started commands, and
project structure — it is accurate and up to date, so this page only adds
what it doesn't cover.

- **Server:** Express + TypeScript on Node's built-in `node:sqlite`
  (`server/src/index.ts`, `server/src/db.ts`, `server/src/routes/members.ts`).
  Requires Node >= 22.5 for `node:sqlite` (see `package.json` `engines`).
- **Client:** React 19 + Vite (`client/src/App.tsx` is the entire UI — one
  component, no router, no state library).
- Dev: client (port 5173) proxies `/api/*` to the server (port 4060) — see
  `client/vite.config.ts`. In production the client is expected to be served
  separately; there is no static-file serving wired into `server/src/index.ts`.
- The `README.md` "Project structure" listing omits a few files that exist:
  `server/src/routes/members.test.ts`, `eslint.config.mjs`, both `tsconfig*.json`
  files, and `client/index.html`. Not a contradiction, just an incomplete list.

For the request-failure gotcha around department validation, see
[[gotchas]]. For the schema, see [[data-model]]. For the request flow, see
[[architecture]].
