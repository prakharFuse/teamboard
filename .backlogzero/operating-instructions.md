# Repository Overview

- Teamboard is a small Node CLI fixture (task-tracking demo), not a real product. No build step, no framework.
- Run it directly: `node src/index.js <command>` or `npm start -- <command>`. Commands are `status`, `tasks`, and `help`.
- Configurable values live in `src/store.js`'s `DEFAULTS` object (in-memory, resets on every process start). README.md's Configuration section claims env vars are read from `src/config.ts` — that file does not exist in this tree and nothing under `src/` reads `process.env`. Treat `src/store.js`'s `DEFAULTS` as the real source of truth, not the README.
- This repo's content is reseeded from `tests/journeys/seed/journey-repo/` in a separate repository. Changes made here apply only to the current task — this is not the place for long-term fixture-pack maintenance.

# Code Style

- Pure ESM throughout `src/`: `package.json` sets `"type": "module"`; use `import`/`export` only — no `require()`, no `.cjs`.
- Plain JavaScript only — no TypeScript, no tsconfig, no TS build step. Don't reintroduce TypeScript tooling unless a ticket explicitly asks for it.
- No linter or formatter is configured (no `.eslintrc*`, no `.prettierrc*`). Match the existing style by hand: single quotes, 2-space indentation, semicolons, trailing commas in multiline literals/args.
- Each `src/` file opens with a `/** ... */` block comment describing its role — follow this pattern in new files.

# Testing

- Run tests with `npm test` (runs `node --test`) — no Jest/Mocha/Vitest dependency exists or should be added.
- Test files live in `test/`, named `<module>.test.js`, importing directly from `node:test` and `node:assert` (strict), and importing source by relative path (e.g. `../src/logger.js`) — no path aliases.
- Write one `test(...)` block per behavior/case rather than one large test with multiple asserts.

# Fixture Gotchas — Don't Fix Speculatively

IMPORTANT: Several files carry intentional rough edges (marked with `FIXTURE NOTE` comments) left for future tickets to fix — do not correct any of the following unless the current ticket explicitly asks for that specific change:
- README.md's misspelled heading "Teambaord" — the entire subject of a separate fixture ticket.
- The scattered magic numbers in `src/api-client.js` (`baseUrl`, `region`, retry count `3`, abort timeout `15000`, backoff base `250 * 2 ** attempt`, page size `50`) — centralizing these is a separate ticket's job.
- The level concept in `src/logger.js` and the arg parser in `src/index.js` — both exist so a future `--quiet` flag has somewhere to land; don't remove or collapse either as unused.
- The global, non-tenant settings store in `src/store.js` — migrating it to per-tenant is a separate ticket; don't add a tenant key speculatively.