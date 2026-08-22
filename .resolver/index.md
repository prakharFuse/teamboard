# .resolver index

## knowledge

- `knowledge/architecture.md` · global · Real component shape of TeamBoard — client, server, and SQLite, with actual ports and proxy wiring
- `knowledge/data-model.md` · global · The members table schema and the soft-delete flag that the API doesn't actually use for deletes
- `knowledge/gotchas.md` · global · Non-obvious behaviors verified in code — route ordering, hard delete vs the is_active flag, and inconsistent seed department names
- `knowledge/overview.md` · global · What TeamBoard is, where the stack/endpoint docs live, and the one CI fact those docs don't mention

## conventions

- `conventions/ingested-claude.md` · global · Team claude-md rules from CLAUDE.md
- `conventions/testing.md` · server/** · How TeamBoard's server tests are structured — in-memory SQLite, ephemeral HTTP server per call, tests run against built JS
