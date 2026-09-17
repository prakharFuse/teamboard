---
name: gotchas
description: Planted fixture issues that look like code smells but must NOT be "fixed" incidentally
type: knowledge
scope: global
updated: '2026-09-17'
captured_sha: 605e18e9f773ad15b3e0009302ccc07b31b620a0
sources:
  - README.md
  - src/index.js
  - src/api-client.js
  - src/logger.js
  - src/store.js
  - test/logger.test.js
sources_sha256:
  README.md: f904a61e1f2a6dc9b4f30ea4f883e1cddafcb46de99ddc54f340652fe45f1068
  src/api-client.js: c44bb95a43cdf4ed0873db16cb31b8a3c2f39528ca13e0ed72dc9cd39b3dd01c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
  src/logger.js: a29b88a18c23737f5f9215512159f9cbfe4476eca88c6e5dfd895dc5cfc5920b
  src/store.js: 8f8528bccd22f7a8989e9df6bb7368e04f8678a5ecd44480ba3a0100189db4bc
  test/logger.test.js: c4eed64e2022370b3212b33c64de4cb744bdacb15b12e8900bcc172a045408fa
---

This repo is a journey-suite fixture (see [[overview]]): several things that
look like obvious cleanups are actually the *subject* of a planned ticket.
Each is marked in-code with a `FIXTURE NOTE` comment. If a task you're given
isn't explicitly about one of these, don't touch it as a "drive-by fix" —
doing so removes the subject the real ticket needs.

- **`# Teambaord` typo in README.md line 1** — misspelled on purpose. An
  `easy` tier fixture issue asks an agent to correct it. Fixing it outside
  that ticket makes the easy-tier journey a no-op.

- **Hardcoded/scattered config in `src/api-client.js`** — `baseUrl`
  (`https://api.teamboard.example.com/v1`), `region` (`us-east-1`), retry
  count (`3`), request timeout (`15000`ms), backoff base (`250 * 2 **
  attempt`), and page size (`50`) are all magic values, deliberately not
  centralized. A `complex` tier fixture issue asks an agent to audit the repo
  for exactly this pattern and decide what belongs in a config module vs. an
  env override vs. an inline constant. Consolidating these preemptively
  removes that ticket's subject.

- **`currentLevel` default in `src/logger.js`** — hardcoded to `'info'`; this
  is one of the values the config-centralization fixture above is expected to
  find. Same rule: don't move it into a config module unless that's the task.

- **No `--quiet` flag in `src/index.js`** — a `medium` tier fixture issue asks
  an agent to add one that suppresses info-level output, backed by
  `src/logger.js`'s existing level concept, plus "one unit test" landing in
  `test/logger.test.js`. Don't add `--quiet` speculatively; it's the answer to
  a specific ticket, not a missing feature to proactively fill in.

- **Global (non-per-tenant) `src/store.js`** — `settings` is a single global
  `Map`, no tenant dimension. A `complex` tier fixture issue asks an agent to
  migrate this "legacy global settings store" to a per-tenant schema. Keep it
  global unless that migration is the actual task.

- **README.md points at a `src/config.ts` that doesn't exist** — see the
  divergence note in [[overview]]. This looks like a stale doc, not a fixture
  puzzle in itself, but don't assume the file exists or try to "restore" it
  without being asked — it may simply be a leftover reference from an earlier
  version of the fixture pack.

General rule for this repo: prefer the smallest possible diff for whatever
ticket you're given, and treat any other rough edge you notice as
intentional unless told otherwise.
