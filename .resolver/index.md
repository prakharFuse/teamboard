# .resolver index

## knowledge

- `knowledge/architecture.md` · global · Real runtime shape of client, server, and DB, and how requests actually flow between them
- `knowledge/data-model.md` · global · The members table schema — fields, defaults, and how is_active/soft-delete actually behaves
- `knowledge/gotchas.md` · global · Known sharp edges in the members API — read before touching validation, export, or delete/patch behavior
- `knowledge/overview.md` · global · Project purpose, layout, and commands — start here; see CLAUDE.md/README.md for the base facts

## conventions

- `conventions/api-conventions.md` · server/** · Route-handler conventions for server/src/routes — error shape, SQL style, lazy DB access
- `conventions/ingested-claude.md` · global · Team claude-md rules from CLAUDE.md
- `conventions/testing.md` · server/** · How TeamBoard tests are written and run — Node test runner, colocated *.test.ts, in-memory SQLite
