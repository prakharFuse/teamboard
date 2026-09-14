---
name: code-style
description: ESM import conventions, TS strictness, and lint setup for TeamBoard
type: convention
scope: global
updated: 2026-09-14 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - eslint.config.mjs
  - server/tsconfig.json
  - client/tsconfig.json
  - server/src/routes/members.ts
  - server/src/db.ts
sources_sha256:
  client/tsconfig.json: 00247b06e99a5a094f8320007d29395811d5285fef33ba4baa50a52a9c67b0c3
  eslint.config.mjs: d644abe83347b5fb3625d32c94d84182eddb8fc1a942c0f81b42c386c1766d92
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
  server/tsconfig.json: c03a42191f0418edbd3bf5fd54fef37ed91be7c0412042a354650ea7e46413c7
---

The whole repo is ESM (`"type": "module"` in `package.json:5`). Server-side relative imports use explicit `.js` extensions even though the source files are `.ts` — e.g. `import { getDb } from '../db.js'` (`members.ts:2`), `import membersRouter from './routes/members.js'` (`server/src/index.ts:3`). This is required by `moduleResolution: "NodeNext"` in `server/tsconfig.json:5`; omitting the extension will fail the build. Client code under `moduleResolution: "bundler"` (`client/tsconfig.json:5`) follows the same `.js`-extension convention for consistency (`main.tsx:3-4`) even though Vite's bundler resolution doesn't strictly require it.

Both `tsconfig.json` files set `"strict": true` — no implicit `any`, and DB row results are cast through `as unknown as MemberRow` (e.g. `members.ts:22`) rather than a direct `as MemberRow`, since `node:sqlite`'s `.get()`/`.all()` return loosely-typed results that TS won't let you cast directly.

Lint is `eslint.config.mjs` using `@eslint/js` recommended + `typescript-eslint` recommended, with `dist/`, `node_modules/`, `data/` ignored (`eslint.config.mjs:5`) — there's no repo-specific rule overrides beyond the two recommended configs, so don't assume stricter conventions (e.g. no-console, import ordering) are enforced beyond what those presets already check.

Route handlers in `members.ts` follow one recurring pattern worth matching for new routes: fetch the row first with a `SELECT ... WHERE id = ?`, `if (!row) { res.status(404)...; return; }` guard, then act (`members.ts:71-81`, `83-104`, `106-117`). New `:id`-scoped routes should follow this same existence-check-then-act shape rather than relying on `UPDATE`/`DELETE` row-count to detect a missing row.
