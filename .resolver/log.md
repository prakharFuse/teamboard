2026-08-21 · first-run · created .resolver

- Explored CLAUDE.md, README.md, package.json, CI workflow, and all server/client source.
- CLAUDE.md and README.md are accurate for stack, layout, and commands — knowledge/overview.md points to them rather than restating.
- Captured gaps not covered by user docs: intentional red CI test (TM-105 department validation), single-table SQLite schema with no enums/migrations and inconsistent seed data, PATCH field restrictions, export vs list active-filter mismatch, test DB isolation pattern, and Express static-route-before-`/:id` ordering requirement.
- No genuine divergences found — user docs make no claims the code contradicts, only omissions.
