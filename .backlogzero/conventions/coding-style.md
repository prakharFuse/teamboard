---
name: coding-style
description: TypeScript/ESM conventions used across server and client
type: convention
scope: global
updated: 2026-09-13 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/tsconfig.json
  - client/tsconfig.json
  - eslint.config.mjs
  - server/src/routes/members.ts
sources_sha256:
  client/tsconfig.json: 00247b06e99a5a094f8320007d29395811d5285fef33ba4baa50a52a9c67b0c3
  eslint.config.mjs: d644abe83347b5fb3625d32c94d84182eddb8fc1a942c0f81b42c386c1766d92
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
  server/tsconfig.json: c03a42191f0418edbd3bf5fd54fef37ed91be7c0412042a354650ea7e46413c7
---

- Both `server/` and `client/` use `strict: true` TypeScript. The server
  targets `NodeNext` module resolution, which is why relative imports in
  `.ts` source use an explicit `.js` extension (e.g. `import { getDb} from
  '../db.js'` in `members.ts:2`) — this is required by `NodeNext`, not a
  typo; keep it when adding new server imports.
- Lint is flat-config ESLint (`eslint.config.mjs`) using
  `typescript-eslint`'s `recommended` preset with no project-specific
  overrides — `dist/`, `node_modules/`, and `data/` are ignored.
- Route handlers return `void` explicitly and use early `return;` after
  sending an error response (e.g. `members.ts:29-31`), rather than
  `else`-branching — follow this pattern for new handlers so response-ends
  are easy to scan.
- No React state-management library — `App.tsx` uses local `useState` /
  `useEffect` only; data refetches (`loadMembers()`, `loadStats()`) are
  called manually after mutations rather than via a cache/query library.
