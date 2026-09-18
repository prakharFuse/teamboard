---
name: testing
description: How tests are written and run in this repo — Node's built-in test runner, no framework
type: convention
scope: global
updated: 2026-09-18 (IONE-959)
captured_sha: 88dd68751303506f969e7b6a8e78fe17799821e0
sources:
  - test/bamboohr-client.test.js
  - test/sso-client.test.js
  - test/members.test.js
  - test/member-lifecycle.test.js
sources_sha256:
  test/bamboohr-client.test.js: 9da1bf66d7bc10583e982867b104194eb6681cc0eb80d26c152d4da3046c1e25
  test/member-lifecycle.test.js: 9a1e84a9cef223f1bb821be976014d8cba85d5e6670ee1264bf5c5f477c65e8b
  test/members.test.js: f066ee740e773bf559ef17057f23fa766f882d7e493119f0313b9a757476decd
  test/sso-client.test.js: 2c3c751f64660f24e608c1532f0e1eb91bdc15f9ce1b6c93d40bc7587e6e2ea3
---

- The member-lifecycle feature (`bamboohr-client.js`, `sso-client.js`,
  `members.js`, `member-lifecycle.js`) is covered by four new test files;
  `store.js`, `api-client.js`, and `index.js` still have none.
- `BambooHrClient` and `SsoClient` are tested by injecting a fake `fetchImpl`
  through the constructor (`new BambooHrClient({ fetchImpl, apiKey })`)
  rather than mocking the global `fetch` — follow that pattern for new
  network clients instead of `src/api-client.js`'s untestable direct
  `fetch` call.
- `members.js` is a module-level singleton (like `store.js`), so its tests
  call `resetMembers()` at the start of every `test(...)` block to avoid
  state leaking between tests.
