# .resolver index

## knowledge

- `knowledge/architecture.md` · global · Real client/server/DB call graph for TeamBoard — read before changing how the pieces talk
- `knowledge/data-model.md` · global · The members table schema and the soft-delete column that DELETE doesn't actually use
- `knowledge/gotchas.md` · server/src/** · Known-red CI test, CSV export escaping, and PATCH field gaps — read before touching members.ts
- `knowledge/overview.md` · global · What TeamBoard is, the tech stack, and how to run it — read first for orientation

## conventions

- `conventions/code-style.md` · global · Lint/typecheck setup and response-handler conventions in the Express routes
- `conventions/testing.md` · server/src/** · How TeamBoard tests are written — no framework, in-memory SQLite, env var must be set before first getDb() call
