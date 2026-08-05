---
name: coding-style
description: API error shape, SQL, and lint/type rules for TeamBoard — supplements CLAUDE.md's Rules section
type: convention
scope: global
updated: 2026-08-05 (IONE-959)
captured_sha: 954ac8ebcb7dafaa72672682a58e3bc82599f6e3
sources:
  - eslint.config.mjs
  - server/tsconfig.json
  - client/tsconfig.json
---

The error-shape and parameterized-SQL rules are already stated in
`../../CLAUDE.md` (Rules section) — follow those. This page covers what's not
written down there.

- **Lint:** flat config (`eslint.config.mjs`) extends `@eslint/js`
  recommended + `typescript-eslint` recommended, with only `dist/`,
  `node_modules/`, `data/` ignored. No project-specific rule overrides exist
  yet — don't assume a stricter or looser ruleset than plain
  `typescript-eslint` recommended.
- **TypeScript strict mode** is on in both `server/tsconfig.json` and
  `client/tsconfig.json` — don't add `// @ts-ignore` or loosen `strict` to
  work around a type error; fix the type.
- **Route handlers return `void`, not the response:** every handler in
  `members.ts` is typed `(req: Request, res: Response): void` and uses
  `res.json(...); return;` rather than `return res.json(...)`. Match this
  when adding routes — it's consistent across every existing handler.
- **`unknown` + explicit cast for DB rows:** query results are always cast as
  `db.prepare(...).get(...) as unknown as MemberRow` (never a direct `as
  MemberRow`) — `node:sqlite`'s types don't line up with the row shape
  directly. Keep the double-cast pattern for new queries rather than adding a
  generic wrapper.
