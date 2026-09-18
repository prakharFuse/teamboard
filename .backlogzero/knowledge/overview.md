---
name: overview
description: What this repo is, why it exists, and its real (current) file layout
type: knowledge
scope: global
updated: 2026-09-18 (IONE-959)
captured_sha: 88dd68751303506f969e7b6a8e78fe17799821e0
sources:
  - package.json
  - README.md
  - src/index.js
  - src/bamboohr-client.js
  - src/member-lifecycle.js
  - src/members.js
  - src/sso-client.js
sources_sha256:
  README.md: f904a61e1f2a6dc9b4f30ea4f883e1cddafcb46de99ddc54f340652fe45f1068
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  src/bamboohr-client.js: 928e8c22df39838d0daf4d5e06a660cddb14987c4e7c360907d9d695dcaca0f4
  src/index.js: d0c79ded5c8cd2568f09e86c5b55f92b94b3b92628f1cf3b5607d88e30d77094
  src/member-lifecycle.js: f13689c0cc4fba10783791e36abc48a809da296581ba37baa4747b116a553b0f
  src/members.js: 432cb7d63c9a4bc6d5268c12acd304f9df0201f49297d6c9546b592f8c2fe8d8
  src/sso-client.js: e460e4576528e65d9e59b5e41794ad36e70bd7c338f0a374c2d4863c83330cdf
diverges_from:
  - source: README.md#Configuration
    claim: Environment variables are read in src/config.ts; see that file for the current list.
    reality: src/config.ts does not exist; BAMBOOHR_API_KEY and SSO_API_TOKEN are read directly via process.env in src/bamboohr-client.js and src/sso-client.js, with no centralized list.
    authority: code
    detected: '2026-09-18'
    run: 1227ba3d-713b-4bba-9010-d9527ba4689b
---

Purpose and re-seeding process are covered in `../../README.md` — read that
first. This page adds only what the README doesn't state.

## Current shape (code-verified)

The repo is JS-only, no TypeScript, no build step, no third-party
dependencies (`package.json` has no `dependencies`/`devDependencies` block at
all). Eight files make up the app:

- `src/index.js` — CLI entrypoint (`teamboard <command>`), commands: `status`,
  `tasks`, `help`, `members:import`, `members:deactivate`,
  `members:reconcile-sso`.
- `src/logger.js` — levelled console logger (`debug`/`info`/`warn`/`error`).
- `src/store.js` — in-memory, process-global settings store with hardcoded
  defaults.
- `src/api-client.js` — `fetch`-based HTTP client for a (fake/example)
  upstream task API, with hand-rolled retry/backoff.
- `src/bamboohr-client.js` — `fetch`-based HTTP client for a (fake/example)
  BambooHR directory API; fails fast (no retry) on 401/403 instead of
  retrying, and exports `mapEmployee` to validate/shape a raw directory
  record.
- `src/sso-client.js` — `fetch`-based HTTP client that POSTs a member
  termination to a (fake/example) SSO provider; treats any 204/empty-body
  `res.ok` as success rather than calling `res.json()`.
- `src/member-lifecycle.js` — orchestrates BambooHR import and SSO
  deprovisioning against `src/members.js`; added for ticket TEAM-6 to close
  two gaps: BambooHR import records used to vanish silently on bad data
  instead of being reported, and deactivating a member never told the SSO
  provider, so their SSO access outlived their TeamBoard membership.
- `src/members.js` — in-memory, process-global member store (status,
  external id, SSO deprovision state), same singleton pattern as `store.js`.

`test/` now has five files: `logger.test.js`, `bamboohr-client.test.js`,
`sso-client.test.js`, `members.test.js`, and `member-lifecycle.test.js`, all
run via Node's built-in `node --test` (see `../conventions/testing.md`).
`store.js`, `api-client.js`, and `index.js` still have no tests.

There is no `client/` or `server/` split and no database in this repo as of
`605e18e` ("fixture: remove server/tsconfig.json (no longer in the pack)") —
an earlier variant of the fixture pack apparently had a `server/tsconfig.json`
that no longer applies. Don't assume a client/server architecture from older
context; the working tree above is authoritative.

## Divergence from README

`../../README.md`'s "Configuration" section says "Environment variables are
read in `src/config.ts`. See that file for the current list." That file does
not exist in the current working tree. Two source files now read
`process.env` directly, uncentralized: `src/bamboohr-client.js` reads
`BAMBOOHR_API_KEY` and `src/sso-client.js` reads `SSO_API_TOKEN`, each in its
constructor. Treat the README's Configuration pointer as stale — there is no
`config.ts` and no single place that lists env vars; grep for `process.env`
across `src/` to find the current set.
