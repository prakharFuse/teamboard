# Repository Purpose

Teamboard is a fixture repository for an automated "journey suite" test harness, not a real product. It's a deliberately small, unfinished task-tracking CLI kept around so that agent-planning journeys have real files to clone, branch, and open pull requests against.

Treat the actual working tree as ground truth over any pre-built repository index or over README claims. There is no `client/`, no `server/`, no TypeScript, no database, and no `src/config.ts` — despite these being referenced by README.md's "Configuration" section or by external planning indices. The real app is the flat `src/*.js` CLI.

# Fixture Notes — Do Not "Clean Up" Bait

Several source files contain a `FIXTURE NOTE:` comment marking intentionally "bad" code (a misspelling, a magic number, a global-only store) that is bait for a specific test-suite tier. Always read the `FIXTURE NOTE:` in a file before editing it.

- Never silently "fix" this bait as a drive-by while doing unrelated work (e.g. don't correct a typo, dedupe magic numbers, or refactor a global store just because you noticed it).
- If a task explicitly matches the fixture ticket that a given note targets, that file is exactly where the change belongs.
- Unrelated new features may still touch these files — the constraint is only about incidental "fixes" to the marked bait.

# Code Style

- Plain ES modules (`"type": "module"` in package.json) — no TypeScript, no bundler, no transpile step.
- Relative imports must include the `.js` extension (e.g. `from './logger.js'`).
- Use named exports (`export function` / `export const` / `export class`), not default exports.
- Throw plain `new Error(message)` — no custom error classes.
- Route all logging through `src/logger.js`'s `logger` object; never call `console.log`/`console.error` directly.
- New `src/*.js` files should open with a `/** ... */` block comment describing the module's purpose, matching existing files.
- No linter or formatter is configured (no `.eslintrc`, no `.prettierrc`) — match the style already present in the file you're editing.

# Commands

- Run the CLI: `npm start -- <command>`.
- Run tests: `npm test` (Node's built-in `node --test` runner — there is no Jest, Mocha, or Vitest, and package.json declares zero dependencies).

# Testing

- Test files live under `test/` at the repo root (not co-located with source), named `<module>.test.js`, importing the module under test via relative path (e.g. `../src/logger.js`).
- Import `node:assert` (`strict as assert`) and `node:test` (`test`).
- Match existing style: plain `test('description', () => { ... })` blocks using `assert.equal` / `assert.throws` / `assert.doesNotThrow` — no test-framework setup/teardown machinery.

# Gotchas

- `src/store.js`'s settings store is an in-memory `Map` with hardcoded defaults — it resets on every process start; there is no persistence layer.
- `ApiClient` (`src/api-client.js`) does not read from `store.js`. The CLI reads `store.getSetting('retention.days')` but doesn't actually thread it into API requests today.
