# .backlogzero index

## knowledge

- `knowledge/architecture.md` · global · Real request-flow shape of TeamBoard (client → Vite proxy → Express → SQLite)
- `knowledge/data-model.md` · global · The single `members` SQLite table and its columns/constraints
- `knowledge/gotchas.md` · global · Behavior that isn't obvious from the API table or column names — read before touching members.ts
- `knowledge/overview.md` · global · What TeamBoard is, tech stack, and how to run it — read first for repo orientation

## conventions

- `conventions/coding-style.md` · global · TypeScript/module conventions for server and client — ESM NodeNext vs bundler, strict mode, ESLint
- `conventions/testing.md` · server/** · How TeamBoard tests are structured — node:test, in-memory SQLite, ephemeral HTTP server
