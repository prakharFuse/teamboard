---
name: coding
description: TypeScript/module conventions and error-handling pattern for server routes
type: convention
scope: global
updated: 2026-09-12 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/tsconfig.json
  - client/tsconfig.json
  - eslint.config.mjs
  - server/src/routes/members.ts
  - server/src/index.ts
sources_sha256:
  client/tsconfig.json: 00247b06e99a5a094f8320007d29395811d5285fef33ba4baa50a52a9c67b0c3
  eslint.config.mjs: d644abe83347b5fb3625d32c94d84182eddb8fc1a942c0f81b42c386c1766d92
  server/src/index.ts: 6c2c286cd087d1bbf54d47cbab8b0ee3aa1e86795a2a1a615588e18f9541762b
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
  server/tsconfig.json: c03a42191f0418edbd3bf5fd54fef37ed91be7c0412042a354650ea7e46413c7
---

Both `server/` and `client/` use `strict: true` TypeScript. The server targets
`NodeNext` module resolution (`server/tsconfig.json:4-5`), which is why every
relative import in `server/src/` uses an explicit `.js` extension even though
the source files are `.ts` (e.g. `import { getDb } from '../db.js'` in
`members.ts:2`) — this is required by `NodeNext`, not a typo; don't drop the
extension when adding new server files. The client uses `moduleResolution:
"bundler"` (`client/tsconfig.json:5`) and does not need `.js` extensions.

Lint is `@eslint/js` recommended + `typescript-eslint` recommended
(`eslint.config.mjs:6-7`) — no project-specific rule overrides, so don't assume
stricter or looser rules than the defaults (e.g. no `no-explicit-any` override,
no import-order rule).

Route handlers in `members.ts` don't validate most inputs beyond presence
checks, and there is no global Express error-handling middleware in
`index.ts` — an unhandled exception in a handler (e.g. a thrown DB error other
than the explicitly-caught `UNIQUE` case in `members.ts:39-45`) falls through to
Express's default handler and returns a bare 500. Follow the existing pattern
of catching only the specific error you expect and re-throwing otherwise,
rather than adding a blanket try/catch.
