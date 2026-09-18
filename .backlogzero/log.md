2026-09-18 · first-run · created .backlogzero
1227ba3d-713b-4bba-9010-d9527ba4689b: regenerate knowledge/architecture.md — add bamboohr-client, sso-client, members, member-lifecycle modules to the call graph
1227ba3d-713b-4bba-9010-d9527ba4689b: regenerate knowledge/overview.md — file count 4->8, new commands, new test files, process.env now used outside config.ts
1227ba3d-713b-4bba-9010-d9527ba4689b: add-fact conventions/testing.md — fetchImpl injection pattern and resetMembers() singleton-reset pattern for new tests
1227ba3d-713b-4bba-9010-d9527ba4689b: add-fact knowledge/fixture-gotchas.md — TEAM-6 member-lifecycle files are real feature code without a FIXTURE NOTE comment
1227ba3d-713b-4bba-9010-d9527ba4689b: add-fact conventions/coding-style.md — new HTTP clients use injectable fetchImpl, unlike api-client.js
1227ba3d-713b-4bba-9010-d9527ba4689b: record divergence on knowledge/overview.md — README Configuration section still points at nonexistent src/config.ts while two new files now read process.env directly
2026-09-18 · 1227ba3d-713b-4bba-9010-d9527ba4689b · corrected knowledge/overview.md — README.md#Configuration is stale (src/config.ts does not exist; BAMBOOHR_API_KEY and SSO_API_TOKEN are read directly via process.env in src/bamboohr-client.js and src/sso-client.js, with no centralized list.)
