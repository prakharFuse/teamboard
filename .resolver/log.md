2026-08-21 · first-run · created .resolver

- Explored: CLAUDE.md, README.md, package.json, .github/workflows/ci.yml, server/src/**, client/src/**, eslint/tsconfig files.
- CLAUDE.md and README.md are accurate and cited directly rather than duplicated (overview.md).
- Materialized gaps not covered by either doc: the CI-known-red TM-105 test, inconsistent
  department values already present in seed data, Express static-route-before-`:id` ordering,
  fragile UNIQUE string-match for 409s, PATCH's actual field allowlist, NodeNext `.js`-extension
  import rule, and the node:test + in-memory-SQLite testing pattern.
- No divergence found between CLAUDE.md/README.md and the code — only gaps.
