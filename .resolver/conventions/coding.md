---
name: coding
description: TypeScript/ESM conventions to follow when editing server or client source
type: convention
scope: global
updated: 2026-08-31 (IONE-959)
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

- Pure ESM (`"type": "module"` in package.json). Server uses
  `module`/`moduleResolution: NodeNext`, which requires relative imports to
  use the compiled `.js` extension even though the source is `.ts` — e.g.
  `import membersRouter from './routes/members.js'` in server/src/index.ts
  resolves to `members.ts`. Keep using `.js` in new relative imports under
  `server/src`.
- `strict: true` in both server/tsconfig.json and client/tsconfig.json —
  no implicit any, keep explicit return types on exported/route-handler
  functions as the existing code does (`(req: Request, res: Response): void`).
- Client uses `moduleResolution: bundler` (Vite), so client-side relative
  imports also use `.js` extensions by convention (see client/src/main.tsx
  importing `./App.js`) even though bundler resolution wouldn't require it —
  match this for consistency within `client/src`.
- ESLint is flat-config (eslint.config.mjs): `js.configs.recommended` +
  `tseslint.configs.recommended`, no project-specific rule overrides and no
  `eslint-disable` comments in the codebase today — don't add ad hoc
  suppressions without a clear reason.
- No ORM — raw `db.prepare(...).run()/.get()/.all()` calls via `node:sqlite`'s
  `DatabaseSync`, with `as unknown as <RowType>` casts on the results
  (see the `MemberRow` pattern in server/src/routes/members.ts). Follow this
  cast pattern rather than introducing a new typing approach for query
  results.
