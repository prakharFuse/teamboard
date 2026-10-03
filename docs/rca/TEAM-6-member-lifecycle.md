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

## PR #60 status

**Not reviewed.** This checkout is the working branch
`queuezero/execute-plan-team-6-…` at `18ba83d`, which was provisioned from
`main`. `git for-each-ref` lists only that branch: there is no local `main`, no
`refs/pull/*` and no PR #60 head, so the PR diff could not be read.

Review checklist for whoever picks up PR #60:

- [ ] **Target:** which repository or service does it change? If it is
      `prakharFuse/teamboard`, it would have to add the `/api/members` surface,
      because that surface does not exist at `18ba83d`.
- [ ] **Coverage:** does it fix the department-validation / export path
      (Issue 1), the deactivation → SSO path (Issue 2), or both?
- [ ] **Root-cause comment:** is the root cause written up in a code comment,
      as an AC requires?
- [ ] **Deprovision test:** is there a test asserting that deactivating a
      member dispatches the SSO/SCIM deprovision call, or sets `is_active = 0`
      and the `deactivated-` prefix, within the 15-minute SLA?
- [ ] **Department test:** is there a test that rejects a non-canonical
      department (e.g. `Eng`) and accepts a canonical one, on both create and
      update?
- [ ] **CSV order test:** is there an assertion that pins the export column
      order to `id,name,email,role,department,start_date,is_active`?
- [ ] **Existing rows:** do already-deactivated rows stay in the export and
      drop out of the active directory view?
- [ ] **Regressions:** are onboarding (BambooHR import of new hires), role
      changes and reactivation covered by tests that still pass?

## Blast-radius / audit status

**Not performed.** The member, BambooHR and IdP data is not reachable from this
environment.

> **Active security risk.** SSO access lasted about 3 weeks after a departure.
> If the cause is a hard delete that never reaches the IdP sync, other departed
> members may still have live SSO access right now.

The owning system should run this audit **now**, without waiting on this repo
or on PR #60: across all Okta-integrated customers, list every departed member
whose departure timestamp has no matching IdP revocation event. Revoke any
matches manually in the IdP, then record the result in the PR description or a
linked ticket comment, as the last AC requires.

## Acceptance criteria status

| # | TEAM-6 acceptance criterion | Status |
|---|---|---|
| 1 | BambooHR sync completes without error for all 4 affected customers; no records silently dropped | Unmet — requires owning service |
| 2 | A test covers the specific BambooHR failure condition and asserts correct handling | Unmet — requires owning service |
| 3 | Deactivation terminates the SSO session within a defined window (suggested: 15 min), enforced in the deactivation code path | Unmet — requires owning service |
| 4 | A test asserts that deactivation triggers the SSO deprovision (SCIM/webhook) dispatch within the SLA | Unmet — requires owning service |
| 5 | PR #60 reviewed and merged, or superseded by a PR covering both issues with a root-cause comment in code | Unmet — requires owning service |
| 6 | No regression in onboarding, role-update and reactivation flows; existing suite green | Met for this repo: `npm test` passes 2/2; no src/test changes |
| 7 | Audit of other recently departed members completed and documented | Unmet — requires owning service |

Note on row 6: onboarding, role-update and reactivation flows **do not exist in
this repository**. "Met" means only that this repo's existing suite (2
`setLevel` cases in `test/logger.test.js`) still passes and that TEAM-6 changes
no code. It says nothing about those flows in the owning service.

## Open questions / evidence required

1. **Affected customers:** who are Customer A–D, and has each one consented to
   its logs and data being used for reproduction?
2. **IdP scope:** which identity provider(s) are involved? Okta only, or also
   Azure AD or Google Workspace?
3. **Service boundaries:** do the BambooHR export and the SSO sync share a
   lifecycle service, event bus or DB transaction, or are they separate
   subsystems that fail in a similar way?
4. **Unreported cases:** were there other departed-member SSO retentions that
   were never escalated?
5. **BambooHR job logs:** per-customer import job logs and rejected-row
   reports for the failing runs.
6. **Deactivation code path:** the actual `DELETE` / deactivate handler and the
   Okta sync job source in the owning service.
7. **Audit query:** the departed-member vs IdP-revocation query, and its result.
8. **Deadline:** the agreed delivery date for the RCA and the fix, given
   active customer impact. Is a parallel compliance or legal escalation needed?

## Recommended next steps

In priority order, for the team that owns `/api/members`. Each item can become a
separate ticket.

1. **Blast-radius audit and manual revocation (urgent).** Run the
   departed-member vs IdP-revocation query across all Okta-integrated
   customers, revoke any live accounts in the IdP by hand, and document the
   result.
2. **Replace the hard delete with a soft delete.** Deactivation should set
   `is_active = 0` and apply the `deactivated-` email prefix, or call SCIM
   deprovision directly. Add a test asserting that the deprovision signal is
   emitted within the 15-minute SLA.
3. **Validate department against a canonical list** on both create and update,
   correct the seed data, and add tests that reject non-canonical values
   (e.g. `Eng`) and accept canonical ones.
4. **Pin the CSV export column order** to
   `id,name,email,role,department,start_date,is_active` and add a test that
   asserts it.
5. **BambooHR replay test.** Replay anonymised failing payloads from Customer
   A–D through the import pipeline in staging and assert that no row is
   silently dropped.

## Note on durability

This repository is re-seeded from an upstream fixture pack on every
provision, so edits made directly here are overwritten. Treat this file as a
snapshot of the investigation at `18ba83d`. Keep the durable copy of these
findings in the PR description or on the TEAM-6 Jira ticket.

**Why no tests were added:** this repository has no member lifecycle, BambooHR
or SSO code path for a test to exercise. A test against a fabricated
`members` module would pass without touching the code where the incidents
happened, and would give false confidence. The tests in *Recommended next
steps* belong in the owning service.
