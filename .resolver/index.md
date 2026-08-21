# .resolver index

## knowledge

- `knowledge/architecture.md` · global · Real runtime shape of the client/server/DB split, derived from imports and configs
- `knowledge/data-model.md` · global · The single `members` SQLite table and its column-level constraints
- `knowledge/gotchas.md` · global · Known-red CI test, missing department validation, and other sharp edges not documented elsewhere
- `knowledge/overview.md` · global · Where to start — project shape, stack, and commands (mostly lives in the repo's own docs)

## conventions

- `conventions/ingested-claude.md` · global · Team claude-md rules from CLAUDE.md
- `conventions/module-system.md` · server/** · ESM + NodeNext import rules for the server — why relative imports end in .js
- `conventions/testing.md` · server/** · How server tests are structured — no test framework, in-memory SQLite, real HTTP calls
