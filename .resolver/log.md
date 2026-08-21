2026-08-21 · first-run · created .resolver

- Explored CLAUDE.md, README.md, package.json, server/src (index.ts, db.ts,
  routes/members.ts, routes/members.test.ts), client/src/App.tsx,
  .github/workflows/ci.yml, eslint.config.mjs, tsconfig files, vite.config.ts.
- CLAUDE.md and README.md already cover layout, commands, endpoints, and the
  error/SQL conventions well — pointed to them rather than restating.
- Materialized: architecture diagram, single-table data model, a gotchas page
  (missing department validation / TM-105, inconsistent seed department
  naming, hard-delete despite `is_active`, PATCH's limited field set, CSV
  export escaping bug), and a testing convention page (compiled-output test
  run, `:memory:` DB isolation timing).
- No genuine divergences found between the user docs and the code — only gaps
  the docs don't cover, so no `## Divergences` sections were needed.
