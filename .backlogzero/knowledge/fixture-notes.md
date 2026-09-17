---
name: fixture-notes
description: Map of the intentional "bait" left in each source file for the journey-suite fixture tickets — read before touching any of these files
type: knowledge
scope: global
updated: '2026-09-17'
captured_sha: 972029cfa19a16e34755d00407a08b3b0542cf5c
sources:
  - README.md
  - src/index.js
  - src/logger.js
  - src/api-client.js
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

Each file below carries a `FIXTURE NOTE:` comment identifying what an agent is expected to find
or change. This is the actual subject matter of the fixture — see [[overview]] for the broader
context. Do not "clean up" the items marked intentional unless the task at hand is the specific
fixture ticket that targets them.

| File | Intentional bait | What it's for |
|---|---|---|
| `README.md` | "Teambaord" misspelling in the H1 | `tiers.easy` ticket: fix the typo. Leave it misspelled otherwise. |
| `src/logger.js` | Hardcoded `currentLevel = 'info'` default; no `--quiet` support yet | `tiers.medium` ticket: add a `--quiet` flag (suppress info-level output) |
| `src/index.js` | Simple `parseArgs` with only `--verbose`/`--help` recognized | Same `tiers.medium` ticket — this is where a `--quiet` flag would be wired in |
| `test/logger.test.js` | Only tests `setLevel`, nothing for levels/quiet | `tiers.medium` ticket explicitly expects "one unit test" to land here |
| `src/api-client.js` | Hardcoded `baseUrl`, `region`, retry count (3), timeout (15000ms), backoff base (250ms), page size (50) | `tiers.complex` ticket: audit repo for hardcoded config and centralise/externalize it |
| `src/store.js` | Global (non-tenant) in-memory settings `Map` | `tiers.complex` ticket: migrate the "legacy global settings store" to a per-tenant schema |

## Implication for unrelated changes

If a task asks for something else entirely (e.g. a genuinely new feature), it's fine to touch
these files — the constraint is specifically about *incidentally* "fixing" the bait while doing
unrelated work (e.g. don't correct the README typo as a drive-by, don't dedupe the magic numbers
in `api-client.js` while adding a new endpoint). When a task explicitly matches one of these
fixture tickets, its subject file is exactly where the change belongs.
