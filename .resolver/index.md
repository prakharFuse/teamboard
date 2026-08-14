# .resolver index

## knowledge

- `knowledge/architecture.md` · global · Real request-flow shape of TeamBoard — Vite dev proxy, single Express router, DatabaseSync singleton
- `knowledge/data-model.md` · global · The single-table SQLite schema behind TeamBoard, its soft-delete flag, and the lack of any migration path
- `knowledge/gotchas.md` · server/src/** · Known-broken behaviors in members.ts/db.ts — the intentionally-red CI test, unvalidated department, and a JSON-error-contract violation
- `knowledge/overview.md` · global · Entry point for TeamBoard — points to README/CLAUDE.md for stack, layout, and endpoints; only covers what those files don't

## conventions

- `conventions/backend.md` · server/src/** · Express/SQLite route conventions not spelled out in CLAUDE.md — sync handlers, route ordering, error handling
- `conventions/ingested-claude.md` · global · Team claude-md rules from CLAUDE.md
- `conventions/testing.md` · server/src/** · How TeamBoard's server tests are structured — Node's built-in test runner, in-memory SQLite, no client tests yet
