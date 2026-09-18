---
name: fixture-gotchas
description: Intentional imperfections in this repo that must NOT be "fixed" opportunistically — read before touching any file with a FIXTURE NOTE comment
type: knowledge
scope: global
updated: '2026-09-18'
captured_sha: 605e18e9f773ad15b3e0009302ccc07b31b620a0
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

This repo is fixture content for an external journey/test suite, not a
product under active development (see `../../README.md`). Every source file
carries a `FIXTURE NOTE` doc comment identifying a deliberate flaw that is
the *subject* of some other ticket/journey. If you are asked to do unrelated
work in one of these files, do not "clean up" the flaw as a drive-by —
doing so removes the subject of that other ticket and silently breaks it.

Known intentional imperfections, by file:

- `README.md` heading "Teambaord" — misspelled on purpose; it's the subject
  of the `tiers.easy` fixture issue. Do not correct the spelling unless a
  ticket explicitly asks for it.
- `src/api-client.js` — hardcoded `baseUrl`, `region`, retry count (`3`),
  timeout (`15000`), backoff base (`250 * 2 ** attempt`), and page size
  (`per_page=50`) are scattered on purpose. The `tiers.complex` config-
  centralization fixture depends on these being un-centralized. Only
  refactor these if the ticket is specifically about config centralization.
- `src/logger.js` — the level concept (`LEVELS`, `currentLevel`) exists so a
  `--quiet` flag is implementable end-to-end; that's the `tiers.medium`
  fixture. Don't remove or restructure the level machinery incidentally.
- `src/store.js` — a deliberately *global* (non-tenant-scoped) settings
  store; the `tiers.complex` fixture asks for a per-tenant migration. Keep it
  global unless that's the ticket.
- `test/logger.test.js` — placeholder for the "one unit test" the
  `--quiet`/`tiers.medium` fixture expects to land here; it currently only
  tests `setLevel`, not quiet-mode suppression.

If a task legitimately is one of these tickets (add `--quiet`, centralize
config, migrate to per-tenant settings, fix the README typo), then making
exactly that change is correct — these notes mark what NOT to touch as a
side effect of other work, not code that can never change.
