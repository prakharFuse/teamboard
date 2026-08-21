# .resolver index

## knowledge

- `knowledge/architecture.md` · global · Real component shape of TeamBoard — client, server, and DB, and how they connect
- `knowledge/data-model.md` · global · The members table schema — single-table SQLite model, no migrations
- `knowledge/gotchas.md` · global · Non-obvious behaviors in the members API not covered by CLAUDE.md/README
- `knowledge/overview.md` · global · Where to find stack, layout, and command info; points to CLAUDE.md/README plus one gap they omit

## conventions

- `conventions/api-routes.md` · server/src/routes/** · Route ordering and error/SQL conventions for server/src/routes — read before adding a members endpoint
- `conventions/ingested-claude.md` · global · Team claude-md rules from CLAUDE.md
- `conventions/testing.md` · server/** · How TeamBoard tests are structured — no framework, in-memory DB, ephemeral HTTP server
