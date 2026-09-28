---
name: fixture-notes
description: FIXTURE NOTE comments mark intentional gaps for other tickets — do not clean them up
type: convention
scope: global
updated: 2026-09-28 (IONE-959)
captured_sha: 18ba83de44f5251f500db381b15a7b931b7a0c52
sources:
  - README.md
  - src/index.js
  - src/logger.js
  - src/store.js
  - src/api-client.js
  - test/logger.test.js
sources_sha256:
  README.md: f904a61e1f2a6dc9b4f30ea4f883e1cddafcb46de99ddc54f340652fe45f1068
  src/api-client.js: c44bb95a43cdf4ed0873db16cb31b8a3c2f39528ca13e0ed72dc9cd39b3dd01c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
  src/logger.js: a29b88a18c23737f5f9215512159f9cbfe4476eca88c6e5dfd895dc5cfc5920b
  src/store.js: 8f8528bccd22f7a8989e9df6bb7368e04f8678a5ecd44480ba3a0100189db4bc
  test/logger.test.js: c4eed64e2022370b3212b33c64de4cb744bdacb15b12e8900bcc172a045408fa
---

This repo is BacklogZero's journey-suite fixture (see ../../README.md). Several
files carry inline `FIXTURE NOTE:` comments that describe a gap on purpose,
because a *different* journey ticket expects to find and close that gap. Grep
for `FIXTURE NOTE` before doing any general refactor/cleanup pass — do not
"fix" these unless the task you were given is specifically the one named in
the note:

- `src/store.js` — the module-level `Map` singleton and flat (non-tenant)
  `DEFAULTS` are the subject of a "migrate legacy global settings store to
  per-tenant schema" ticket. Don't add namespacing/tenancy speculatively.
- `src/api-client.js` — the hardcoded `baseUrl`, `region`, retry count (`3`),
  timeout (`15000`), backoff formula (`250 * 2 ** attempt`), and page size
  (`50`) are the subject of a "centralise hardcoded config" audit ticket.
  Don't extract these into a config module unless that's the assigned task.
- `src/logger.js` / `src/index.js` — the logger's level concept and the CLI's
  arg parser exist specifically so a "add a `--quiet` flag" ticket is
  answerable. `--quiet` is intentionally **not implemented yet**.
- `README.md`'s misspelled heading ("Teambaord") is intentional — it's the
  subject of an easy-tier typo-fix ticket. Do not correct it unless that's
  the assigned task.

If you are asked to implement one of these tickets directly, the note is your
confirmation that the surrounding code was already shaped to make it
answerable — implement it there rather than restructuring further.

## Testing convention this implies

`test/logger.test.js` carries its own `FIXTURE NOTE` explaining it's the
landing spot for the `--quiet` ticket's "one unit test" requirement — see
[[testing]]. New tests for a fixture-note gap should extend the existing
test file for that module rather than scattering assertions across new files.
