# .resolver index

## knowledge

- `knowledge/architecture.md` · global · Real request flow between client, server, and SQLite — read before changing how components talk to each other
- `knowledge/data-model.md` · global · The members table shape — columns, defaults, and the one index that matters
- `knowledge/gotchas.md` · global · Known intentional-failure state (TM-105) and other surprises before touching members.ts or its tests
- `knowledge/overview.md` · global · What TeamBoard is, where things live, and what the top-level docs already cover

## conventions

- `conventions/api.md` · server/src/routes/** · Status-code and validation patterns used across members.ts routes, beyond what CLAUDE.md's Rules section states
- `conventions/ingested-claude.md` · global · Team claude-md rules from CLAUDE.md
- `conventions/testing.md` · server/src/** · How server tests are structured — in-memory DB, ephemeral HTTP server, no test framework dependency
