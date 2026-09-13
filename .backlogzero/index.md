# .backlogzero index

## knowledge

- `knowledge/architecture.md` · global · Real request flow between client, server, and SQLite — read before touching routing or the DB layer
- `knowledge/data-model.md` · global · The single `members` SQLite table — schema, seed data, and column-name mismatches to watch for
- `knowledge/gotchas.md` · global · Known traps — intentional failing CI test, no department validation, DB singleton timing
- `knowledge/overview.md` · global · What TeamBoard is, tech stack, and where to find setup/API docs

## conventions

- `conventions/coding-style.md` · global · TS module/import conventions and lint setup — NodeNext extensions, strict mode, flat-config ESLint
- `conventions/testing.md` · server/** · How TeamBoard tests are written — no framework, in-memory SQLite, ephemeral HTTP server per call
