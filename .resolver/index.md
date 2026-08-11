# .resolver index

## knowledge

- `knowledge/architecture.md` · global · How the client, server, and DB actually connect at runtime — Mermaid diagram of the real shape
- `knowledge/ci-red-tm-105.md` · server/src/routes/members.ts, server/src/routes/members.test.ts · CI is intentionally red on main — POST /api/members has no department validation (TM-105); read before touching members.ts or its tests
- `knowledge/data-model.md` · server/src/** · The single `members` table schema — columns, constraints, and the soft-delete (is_active) convention
- `knowledge/department-values.md` · server/src/** · Seed data uses inconsistent department strings and no canonical department list exists anywhere in code — read before adding department validation
- `knowledge/overview.md` · global · What TeamBoard is, its stack, and where to start reading — read first for any task

## conventions

- `conventions/ingested-claude.md` · global · Team claude-md rules from CLAUDE.md
- `conventions/testing.md` · server/src/**/*.test.ts · How server tests are written and run — Node's built-in test runner, in-memory SQLite, no mocking framework
