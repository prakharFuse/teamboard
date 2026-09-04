# .backlogzero index

## knowledge

- `knowledge/architecture.md` · global · Real shape of client/server/db and how requests flow — read before touching routing, proxying, or the DB layer
- `knowledge/data-model.md` · global · The members table schema and the is_active/DELETE divergence — read before adding fields or changing removal behavior
- `knowledge/gotchas.md` · global · Known-red CI test and other non-obvious behavior that looks broken but is either intentional or unvalidated — check before touching members.ts or CI
- `knowledge/overview.md` · global · What TeamBoard is, tech stack, and where to look first — read before making any change

## conventions

- `conventions/coding.md` · global · TypeScript/module conventions, lint setup, and the double-cast pattern used for node:sqlite results
- `conventions/testing.md` · server/** · How TeamBoard tests are written and run — no test framework, in-memory SQLite, ephemeral HTTP server per call
