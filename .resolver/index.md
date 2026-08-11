# .resolver index

## knowledge

- `knowledge/architecture.md` · global · How the client, server, and SQLite DB actually talk — verified from entrypoints and imports
- `knowledge/data-model.md` · global · The members table schema — columns, defaults, and the seed data's actual department values
- `knowledge/gotchas.md` · global · Non-obvious runtime behaviors — hard delete vs the is_active column, CSV export escaping, missing department validation
- `knowledge/overview.md` · global · Where to find TeamBoard's stack, layout, commands, and API surface; what's not in the existing docs

## conventions

- `conventions/ingested-claude.md` · global · Team claude-md rules from CLAUDE.md
- `conventions/testing.md` · server/src/** · How TeamBoard server tests are structured — Node's built-in test runner, in-memory SQLite, ephemeral HTTP server per call
