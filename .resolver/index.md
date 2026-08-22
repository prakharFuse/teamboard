# .resolver index

## knowledge

- `knowledge/architecture.md` · global · How the client, server, and SQLite DB fit together and talk to each other
- `knowledge/data-model.md` · global · The members table schema and the is_active soft-delete flag that isn't actually used for deletes
- `knowledge/gotchas.md` · global · Known-red CI test (TM-105 department validation) and other traps before touching members.ts

## conventions

- `conventions/api.md` · server/src/** · Error shape and SQL parameterization rules for server/src/routes — apply when adding/editing endpoints
- `conventions/ingested-claude.md` · global · Team claude-md rules from CLAUDE.md
- `conventions/testing.md` · server/src/** · How server tests are structured (Node test runner, in-memory DB, no mocking library) before adding new tests
