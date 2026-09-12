# .backlogzero index

## knowledge

- `knowledge/architecture.md` · global · Runtime shape — how the Vite client, Express server, and SQLite file talk to each other
- `knowledge/data-model.md` · global · The single `members` table — schema and the soft-delete flag that isn't actually used for deletes
- `knowledge/gotchas.md` · global · Known-red CI test and other traps to check before touching members.ts or its tests
- `knowledge/overview.md` · global · What TeamBoard is, tech stack, and scripts — read first for orientation

## conventions

- `conventions/coding.md` · global · TypeScript/route/import conventions specific to this repo's server and client split
- `conventions/testing.md` · server/** · How TeamBoard tests server routes — no test framework, in-memory DB, ephemeral HTTP server
