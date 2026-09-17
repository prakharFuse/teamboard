# Repository Context

Teamboard is a deliberately small fixture repository used by a journey-test suite to give agents a real repo to plan against, clone, branch, and open PRs on — it is not a real product. Several files carry `FIXTURE NOTE` comments marking planted issues that specific tickets are expected to solve.

README.md claims environment variables are read in `src/config.ts`. That file does not exist, and no source file reads `process.env`. All config values (`baseUrl`, `region`, timeouts, retry counts, store defaults) are hardcoded in place today. Treat the README's `config.ts` reference as stale, not as current behavior — don't try to "restore" that file unless explicitly asked.

# Setup & Running

- `npm install` — there are no dependencies to install today (see Code Style below), this just confirms the environment.
- `npm start -- --help` (or `node src/index.js <args>` directly) runs the CLI.
- `npm test` runs `node --test`, which auto-discovers `test/**/*.test.js`.

# Code Style

- ESM only: `package.json` sets `"type": "module"`. All relative imports need explicit `.js` extensions (e.g. `from './logger.js'`).
- Zero runtime dependencies by design: no `dependencies`/`devDependencies`, no lockfile. Use Node's built-in `fetch` and stdlib instead of adding a package for something Node already covers.
- No TypeScript: every source file is plain `.js`, despite the stale README reference to `src/config.ts`. Don't introduce `.ts` files without also adding a build/type-check step — none exists today.
- Prefer plain functions/objects for stateless modules; reserve classes for components that hold instance state and do networking (the one existing example is `ApiClient`).
- Only one top-level `catch` exists (in `main()`), which logs via `logger.error('fatal', { message: ... })`. Lower-level functions throw plain `Error` objects and let the caller decide — don't add try/catch inside `store.js` or `logger.js`.
- New `src/` files should open with a short block-comment (`/** ... */`) describing the module's role. Only add a `FIXTURE NOTE:` paragraph if you are deliberately planting or documenting fixture behavior, not otherwise.

# Testing

- Test runner is `node --test` (Node's built-in), not Jest/Mocha/Vitest — don't add one of those frameworks.
- Tests import `{ strict as assert }` from `node:assert` and `{ test }` from `node:test`.
- Follow `test/logger.test.js`'s pattern: one `test(...)` call per behavior, using `assert.doesNotThrow` / `assert.throws` / `assert.equal`. No test-framework config file.

# Planted Fixture Issues — Do Not Fix Incidentally

IMPORTANT: Several rough edges in this repo are the deliberate subject of specific tickets, not bugs to clean up as a drive-by fix — leave them exactly as-is unless the task you were given explicitly names them:

- The `# Teambaord` typo on README.md line 1 is intentional (subject of an "easy" tier ticket).
- The scattered hardcoded config in `src/api-client.js` (`baseUrl`, `region`, retry count, timeout, backoff base, page size) is intentionally decentralized (subject of a "complex" tier config-audit ticket).
- `currentLevel`'s hardcoded `'info'` default in `src/logger.js` is one of the values that same config-audit ticket expects to find — don't move it into a config module preemptively.
- The absence of a `--quiet` flag in `src/index.js` is intentional (subject of a "medium" tier ticket that also expects one unit test in `test/logger.test.js`).
- The single global (non-per-tenant) `settings` `Map` in `src/store.js` is intentional (subject of a "complex" tier per-tenant migration ticket).

General rule: prefer the smallest possible diff for whatever ticket you're given, and treat any other rough edge you notice in this repo as intentional unless told otherwise.
