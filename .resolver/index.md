# .resolver index

## knowledge

- `knowledge/architecture.md` · global · Real shape of TeamBoard — client/server processes, the Vite dev proxy, and the single SQLite file
- `knowledge/data-model.md` · global · The single `members` table schema and its unenforced invariants (department, is_active, seed data)
- `knowledge/overview.md` · global · What TeamBoard is, tech stack, and the intentional red-CI gap around department validation

## conventions

- `conventions/code-style.md` · global · ESM/NodeNext import conventions, strict TS, and the flat ESLint config with no project-specific rules
- `conventions/testing.md` · server/** · How server tests are structured — node:test, in-memory SQLite, ephemeral HTTP server per call
