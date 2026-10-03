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

## Issue 1 — BambooHR import failures

**Reported symptom** (summarised from the linked support issues; all customer,
person and tenant identifiers have been left out on purpose):

- BambooHR imports are rejecting rows for at least 4 customer environments
  (called Customer A–D below).
- The rejected rows carry non-canonical `department` values, for example `Eng`,
  `Engg`, `Human Resources`, `IT` and `Product & Design`, where the importer
  expects a value from a fixed canonical list.
- Some files may also have their CSV columns shifted against the expected
  header `id,name,email,role,department,start_date,is_active`. If so, values
  land in the wrong field and get rejected or mis-mapped.

**What this repository contains:** nothing on this path. The code that the
support comments cite is not in this checkout:

| Cited in support comments | Present at `18ba83d`? |
|---|---|
| `POST /api/members` | No |
| `PATCH /api/members/:id` | No |
| `GET /api/members/export` | No |
| `server/src/db.ts` | No: there is no `server/` directory and no `.ts` file |
| `members` table with an `is_active` column | No: there is no SQL, schema or migration |

The repository has no HTTP server (no `createServer`, no `listen`, no
framework) and no CSV parsing or writing code. `src/index.js` handles only the
`help`, `status` and `tasks` commands.

## Issue 2 — SSO retained after offboarding

**Reported symptom** (summarised; identifiers left out on purpose):

- An employee who had left a customer organisation kept working SSO access for
  about 3 weeks after removal.
- The member was removed with a hard `DELETE FROM members`. So no row with an
  email prefixed `deactivated-` and no row with `is_active = 0` ever existed for
  the nightly Okta sync to pick up. The sync had no record of the departure and
  never revoked the IdP account.

**What this repository contains:** nothing on this path. It has no
`DELETE /api/members/:id` handler, no `members` table, no Okta, SCIM or webhook
client, and no scheduled jobs. The only outbound call is `GET /tasks` (see
*Scope inspected*).

## Support hypotheses — unverified leads for the owning service

The support team proposed the causes below. **None of them was verified here.**
The code they refer to is not in this repository. Record them as leads for the
team that owns `/api/members`, not as findings:

1. **Missing department validation:** create and update accept free-text
   `department` instead of checking it against a canonical list (Issue 1).
2. **Wrong seed data:** the canonical department list or the seeded values
   do not match what customers send (Issue 1).
3. **CSV column order:** the export or import column order differs from
   `id,name,email,role,department,start_date,is_active` (Issue 1).
4. **Hard delete instead of soft delete:** removing a member deletes the row
   instead of setting `is_active = 0` and adding the `deactivated-` prefix,
   so the Okta sync never sees the departure (Issue 2).

**Not examined:** no production logs, BambooHR job reports or IdP (Okta) audit
logs were available or reviewed for this RCA. No names, email addresses, IP
addresses or tenant slugs from the support attachments are reproduced in this
document.

## Shared root cause verdict

**NOT DETERMINABLE from this repository.**

The support evidence points to one shared lifecycle surface: the `members`
table and the `/api/members` API. Both issues would follow from two gaps in how
that surface handles member state:

- On write, `department` is stored as free text, which produces Issue 1's
  non-canonical values and the rejected BambooHR rows.
- On removal, the row is hard-deleted instead of being marked `is_active = 0`
  with the `deactivated-` prefix, which hides the departure from the Okta sync
  (Issue 2).

That is a plausible shared cause, since both are failures to keep member state
canonical and visible to downstream integrations. It cannot be confirmed or
ruled out here because the surface itself is not in this checkout. The owning
service has to settle it, using the code and the logs listed under *Open
questions*.

## Look-alike code paths ruled out

Three modules in this repository could look relevant to the ticket's suggested
failure modes ("auth expiry", "silent record drop", "status not persisted").
Each was checked and ruled out.

### (a) `src/api-client.js` — `ApiClient.request` (lines 19–39)

- **It retries every failure, including 4xx.**
  `` if (!res.ok) throw new Error(`HTTP ${res.status}`) `` (line 28) sits inside the `try` whose `catch`
  (lines 30–33) records `lastError` and retries. A 401 is retried exactly like
  a network error.
- **It is bounded:** 3 attempts (line 22), backoff `250 * 2 ** attempt` ms,
  i.e. 250, 500 and 1000 ms (line 33), and a 15000 ms per-attempt
  `AbortController` timeout (line 25).
- **It does not swallow errors.** After the loop it runs `throw lastError`
  (line 38), so the caller always sees the final failure. In the CLI this
  reaches the top-level `main().catch`, which logs `fatal` and sets
  `process.exitCode = 1`.
- **It serves only `/tasks`.** Its one caller is `listTasks` (line 43). It never
  touches BambooHR, an IdP or member data.
- Its hardcoded URL, region, retry count, backoff and timeout are deliberate
  subject matter for the separate config-audit fixture ticket.

**Ruled out** as the "auth expiry" or "silent drop" cause.

### (b) `src/store.js` — global settings store

- It is an in-process `Map` that holds 3 string `DEFAULTS`
  (`notifications.enabled`, `board.columns`, `retention.days`) and is lost
  when the process exits.
- It holds no member records and no tenant records.
- `setSetting()` (line 21) has no callers in `src/` or `test/`
  (`grep -rn setSetting src test` matches only its definition). The only reads
  are `allSettings()` and `getSetting('retention.days')` in `src/index.js`.
- Its global, tenant-less design is deliberate subject matter for the separate
  tenant-migration fixture ticket.

**Ruled out:** it cannot persist, or lose, member status.

### (c) `src/logger.js` — console logger

- It writes only to `process.stdout` / `process.stderr` (lines 23–24). It has
  no external sink, audit trail or event bus that could carry lifecycle events
  to BambooHR or an IdP.

**Ruled out.**

**None of these fixture defects is changed by this ticket.** TEAM-6 makes no
changes to `src/`, `test/` or `package.json`.
