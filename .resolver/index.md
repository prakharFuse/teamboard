# .resolver index

## knowledge

- `knowledge/architecture.md` · global · How the client, server, and SQLite DB fit together and talk to each other
- `knowledge/data-model.md` · global · Schema for the single `members` table and how is_active relates to soft/hard delete
- `knowledge/gotchas.md` · server/src/** · Known sharp edges in the members API not obvious from CLAUDE.md/README — read before touching members.ts

## conventions

- `conventions/ingested-claude.md` · global · Team claude-md rules from CLAUDE.md
- `conventions/testing.md` · server/src/** · How server tests are structured — Node's built-in test runner, in-memory SQLite, ephemeral per-call server
