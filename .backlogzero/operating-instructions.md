## Repository Purpose

- Teamboard is a fixture repository, not a product under active development -- it exists so a separate "journey suite" has a real repo to clone/branch/PR against. Read README.md first for full context.
- There is no server, database, or client app here. Treat any reference to client/, server/, or SQLite-backed Member/Stats structures as stale -- they don't exist in this repository.

## Running & Testing

npm install
npm start -- --help
npm start -- status
npm start -- tasks
npm test

- npm test runs node --test, which picks up test/logger.test.js.
- No build step: the package is plain ESM (type: module in package.json) run directly by Node. No TypeScript, bundler, linter, or formatter is configured anywhere in the repo.

## Code Style

- Plain ESM, no TypeScript: use import/export, 2-space indentation, single quotes.
- No external runtime dependencies -- use the global fetch, not axios/node-fetch or similar.
- One file per concern under src/, flat (no subdirectories). Each module exports either plain functions or a single class.
- Open every module with a block comment, and add an inline comment on non-obvious lines (magic numbers, deliberately-global state) explaining why.
- Tests use the built-in node:test plus node:assert, not Jest/Mocha/Vitest. Test files live in test/, named <module>.test.js, importing from ../src/<module>.js, with one test block per behavior.

## Fixture Content -- Do Not Clean Up

This repo's rough edges are deliberate fixture content for a separate journey-ticket suite. Look for in-file FIXTURE NOTE comments and README.md before touching anything that looks unfinished or messy, and leave the following as-is unless they are the explicit subject of the task:

- README.md's heading misspells "Teambaord" -- intentional; don't fix it opportunistically.
- src/api-client.js hardcodes its base URL, region, retry count (3), request timeout (15000 ms), backoff base (250 ms), and page size (50) scattered across the file -- don't refactor these into a config module unless centralizing config is the task at hand.
- src/store.js is an intentionally global, non-tenant-aware settings store (Map plus flat string defaults) -- don't migrate it to a per-tenant schema unless that migration is the task at hand.
- If asked to add a --quiet flag: add it in parseArgs() (src/index.js:13) to suppress info-level output via setLevel(), plus one unit test alongside the existing two in test/logger.test.js.

## Reseeding / Scope

- This repo's content is reconciled against a tests/journeys/seed/journey-repo/ pack in a separate suite repo, and can be re-seeded via that suite's pnpm test:journey provision-repo command -- that tooling does not live in this repository.
- There is no tests/ directory in this checkout, only test/logger.test.js. Edit this repo directly for fixture work; there is nothing else in this checkout to reconcile against.