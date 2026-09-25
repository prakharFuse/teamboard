
# Overview

- Teamboard is a fixture repository, not a product under active development — see README.md for full context. Its misspelled heading, hardcoded config, and missing `--quiet` flag are intentional, not bugs.
- Single CLI, no server, no persistence beyond an in-memory `Map`. There is no build step.
- Plain ESM JavaScript only — despite README.md's "Configuration" section claiming `src/config.ts` exists, no such file exists, there is no TypeScript anywhere (no `tsconfig.json`), and no code currently reads `process.env`. Don't add `.ts` files without also adding a `tsconfig.json` and a build step.

# Commands

- `npm start` — runs `src/index.js` directly via `node` (package.json has `"type": "module"`).
- `npm test` — runs `node --test` (Node's built-in test runner). There is no Jest/Mocha/Vitest and no `devDependencies` block in package.json.

# Code Conventions

- Every file under `src/` opens with a `/** ... */` block that includes a `FIXTURE NOTE` paragraph tying a hardcoded rough edge to a journey-suite ticket. Preserve these paragraphs — they are load-bearing documentation, not stale TODOs.
- Hardcoded literals (base URL, region, retry count, timeout, page size in `src/api-client.js`; `DEFAULTS` in `src/store.js`) are intentional fixture design. Check the `FIXTURE NOTE` comment in the relevant file before centralizing or "cleaning up" these values.
- No lint or format config exists (no `.eslintrc*`, no `.prettierrc*`) — don't assume a linter will catch style issues.

# Testing

- Test files live under `test/` (not co-located `*.spec.js` or `src/__tests__`) and import directly from `../src/*.js`.
- Use `node:assert`'s strict mode and `node:test`'s `test()`.
- Only `src/logger.js` has coverage today (`test/logger.test.js`: accepts a known level, rejects an unknown one). `src/store.js`, `src/api-client.js`, and `src/index.js` have no tests — don't assume coverage parity across modules when reasoning about test impact.

# Architecture Gotchas

- `src/index.js` is the only entrypoint; it wires together `logger.js`, `store.js`, and `api-client.js` — those three never wire themselves together.
- `store.js` and `api-client.js` never import each other. The `tasks` command reads `retention.days` from the store only to log it — that value is not passed into the `ApiClient` request. Don't assume settings flow through to the HTTP client.
- `api-client.js` logs a warning via `logger.js` on every retry.
