# TEAM-6 — RCA: HR data pipeline failures and SSO gap in member lifecycle

## Verdict

`prakharFuse/teamboard@18ba83d` contains no member lifecycle code. It has no
BambooHR export or import, no SSO/SCIM/Okta integration, no webhooks, no
soft-delete and no deprovisioning. Neither escalation (BambooHR import failures,
SSO access retained after offboarding) can originate in this codebase. A shared
root cause can be neither confirmed nor ruled out from this repository.
**Recommendation:** re-point TEAM-6 at the service that owns `/api/members` and
carry its acceptance criteria over unchanged. The sections below record what was
inspected, which look-alike code paths were ruled out, and what the owning team
needs to do.

## Scope inspected

Tracked files at `18ba83d` (`git ls-files`), 7 in total:

| File | Role |
|---|---|
| `README.md` | Project readme |
| `package.json` | Manifest: `start` and `test` scripts only |
| `src/api-client.js` | `ApiClient`: HTTP client for the upstream task API |
| `src/index.js` | CLI entrypoint: `help`, `status`, `tasks` |
| `src/logger.js` | Levelled console logger |
| `src/store.js` | Global in-memory settings `Map` |
| `test/logger.test.js` | 2 `node:test` cases for `setLevel()` |

`package.json` declares no `dependencies` and no `devDependencies`, so there is
no HR, IdP or SCIM SDK, no database driver and no HTTP server framework.

Module graph:

```
src/index.js
├── src/logger.js      (stdout / stderr only)
├── src/api-client.js  (ApiClient → global fetch)
│   └── src/logger.js
└── src/store.js       (in-process Map, no persistence)
```

The only external I/O in the codebase is one request, made by the `tasks`
command through `ApiClient.listTasks(1)`:

```
GET https://api.teamboard.example.com/v1/tasks?page=1&per_page=50
```

## Evidence

Reproducible from the repository root:

```sh
grep -rniE 'bamboo|sso|scim|member|deactivat|offboard|lifecycle|webhook' \
  src test README.md package.json
echo "exit=$?"
```

Observed at `18ba83d`: **no output, exit code 1**. None of these terms appears
anywhere in the source, the tests, the readme or the manifest.
