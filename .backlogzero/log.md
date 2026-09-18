2026-09-18 · first-run · created .backlogzero

- Indexed the actual working tree (5 src files + 1 test) rather than the
  stale pre-built repo map supplied at session start, which described a
  client/server TS layout (`client/src/App.tsx`, `server/src/db.ts`,
  `server/src/routes/members.ts`) that does not exist in this checkout.
- Wrote knowledge/overview.md, knowledge/architecture.md,
  knowledge/fixture-gotchas.md, conventions/testing.md,
  conventions/code-style.md.
- Skipped knowledge/data-model.md — no database, schema, or ORM model in the
  repo.
- Recorded one divergence: README.md points to `src/config.ts` for env vars;
  that file does not exist and nothing in the repo reads `process.env`.
