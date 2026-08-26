---
name: code-style
description: Lint/typecheck setup and response-handler conventions in the Express routes
type: convention
scope: global
updated: 2026-08-26 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - eslint.config.mjs
  - package.json
  - server/src/routes/members.ts
sources_sha256:
  eslint.config.mjs: d644abe83347b5fb3625d32c94d84182eddb8fc1a942c0f81b42c386c1766d92
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

- Lint is `typescript-eslint`'s `recommended` config plus `@eslint/js` recommended, flat config (`eslint.config.mjs`) — no custom rule overrides, no Prettier config in the repo. Don't add stylistic rules beyond what's there without being asked.
- `pnpm typecheck` runs the server and client `tsconfig.json` separately (`tsc -p server/tsconfig.json --noEmit && tsc -p client/tsconfig.json --noEmit`) — a change spanning both needs both to pass independently; there's no shared/root tsconfig.
- Route handlers are typed `(req: Request, res: Response): void` and return early with `res.status(...).json(...); return;` on error paths rather than throwing (see every handler in `server/src/routes/members.ts`). Follow this pattern for new routes instead of introducing centralized error middleware.
- Row-shape casts go through `unknown` first: `db.prepare(...).get() as unknown as MemberRow` (`members.ts` throughout), since `node:sqlite`'s return types aren't specific enough for a direct cast. Keep this two-step cast for new queries rather than a direct `as MemberRow`.
