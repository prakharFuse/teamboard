# TEAM-6 — Member lifecycle RCA: BambooHR pipeline failures and SSO offboarding gap

> **Caveat:** this repository is reseeded from a separate suite repo
> (`pnpm test:journey provision-repo`, reconciled against
> `tests/journeys/seed/journey-repo/`), so this file may be overwritten. Copy it
> to the TEAM-6 ticket or to the repository that owns member lifecycle.

## Summary

The code responsible for both escalations is not in this repository, so no
root cause can be located here. This checkout contains no BambooHR integration,
no member model, no deactivation or offboarding path, and no SSO, SCIM or IdP
client. The linked support issues cite paths and endpoints that do not exist
anywhere in this checkout.

This document therefore records a reproducible negative result. It restates the
hypotheses from the linked evidence as **unverified** leads for the owning
system and gives a checklist for reviewing PR #60. It does not confirm a root
cause for either escalation, and it does not confirm or rule out a shared one.

## Scope & method

- **Commit inspected:** source content at `18ba83d`. The branch HEAD
  (`8358667`) only adds the `.backlogzero/` knowledge wiki. `git diff 18ba83d
  8358667 -- src test README.md package.json` is empty. The checkout is on a
  local branch with no git remote configured (`git remote -v` is empty), so no
  other branches or PR refs are available.
- **Tracked files inspected (all of them, excluding `.backlogzero/`):**
  `README.md`, `package.json`, `src/api-client.js`, `src/index.js`,
  `src/logger.js`, `src/store.js`, `test/logger.test.js`.
- **Architecture:** a single-process Node.js ESM CLI with no server component.
  It has four `src` modules: the CLI entry point (`index.js`, commands `status`,
  `tasks` and `help` only), a levelled logger, an `ApiClient` whose only
  endpoint is `listTasks`, and a global in-memory settings `Map`. It talks to
  one fixture upstream (`https://api.teamboard.example.com/v1`). The README
  describes it as "Fixture content, not a product".
- **Keyword search (reproducible):**

  ```sh
  grep -rniE "bamboo|sso|scim|member|deactivat|offboard|idp|okta|webhook|department|is_active" --exclude-dir=.git --exclude-dir=.backlogzero .
  ```

  Result: **0 matches** (exit status 1), run before this document existed. Now
  that this file is in the tree, add `--exclude-dir=docs` to reproduce the
  result against the source alone.
- **Paths cited in the linked support issues:** `server/src/db.ts`, a
  `members` table with an `is_active` column, `POST/PATCH/DELETE
  /api/members/:id` and `GET /api/members/export`. None of these exist anywhere
  in this checkout: there is no `server/` directory, no `.ts` file, no database
  and no HTTP routes. This indicates the member lifecycle lives in a different
  codebase.
- **Tests:** `npm test` passes 2/2, but it only covers `setLevel` in the logger.
  It says nothing about member lifecycle flows.

## Issue 1 — BambooHR findings

**Finding in this repo:** nothing to trace. There is no BambooHR API client, no
CSV export or import, no webhook receiver, no field mapper, no department
validation and no member persistence. So this repo cannot show which pipeline
stage fails: webhook receipt, field mapping, transformation, persistence or
downstream sync.

**Hypotheses from the linked evidence (unverified; check them in the owning
system):**

- **(a) No department validation.** Free-text `department` values may be
  accepted on member create/update without a check against a canonical list.
  Values that BambooHR does not recognise would then fail mapping or be dropped.
- **(b) Non-canonical seed data.** Seed or fixture department values may already
  differ from the canonical list. Existing tenants would then carry bad values
  before any user edits.
- **(c) Possible CSV column-order shift in the March release.** This matters
  because the importer is reported to be position-based, not header-based. The
  expected column order is
  `id,name,email,role,department,start_date,is_active`. Any reordering or
  inserted column would silently shift values into the wrong fields.

**Affected customers:** Customer A, Customer B, Customer C and Customer D
(pseudonymised). For each one, catalogue the failure condition separately in the
owning system once consent to access their data has been confirmed.

**Checklist for the owning team:**

- [ ] Reproduce the failure for at least one of Customers A–D by replaying an
      anonymised payload against staging. Record the payload shape and the error.
- [ ] Find the failing stage (receipt / mapping / transformation / persistence /
      downstream sync) and cite the log lines.
- [ ] Compare the export's column order before and after the March release.
- [ ] Separate TeamBoard code defects from customer-side configuration, such as
      field-mapping schema drift or webhook secret rotation, so that follow-on
      tickets are scoped correctly.

## Issue 2 — SSO findings

**Finding in this repo:** nothing to trace. There is no member model, no delete
or deactivate path, no SSO, SCIM or IdP client, and no session-revocation call.
So the offboarding flow cannot be traced from trigger to revocation here.
Whether the gap is systemic or limited to certain conditions (a specific IdP,
manual vs. automated offboarding) also cannot be determined from this checkout.

**Hypothesis from the linked evidence (unverified; for the owning team):**

- The "Remove" action in the member admin UI reportedly **hard-deletes** the
  member row.
- The IdP nightly sync reportedly detects revocation only through a
  `deactivated-` email prefix on **existing** rows.
- So a deleted row never produces a revocation signal. The sync has nothing
  left to compare against, and the departed member's SSO session stays valid
  until it expires or someone revokes it by hand. That fits the roughly 3-week
  retention reported in the escalation.

**SLA note:** a nightly sync cannot meet the suggested 15-minute termination
window, even once the delete/prefix mismatch is fixed. Revocation (an IdP
session-revoke call, SCIM deprovision or webhook dispatch) must be triggered
from the deactivation code path itself, either synchronously or through a
queued job with an SLA-bounded retry. The nightly sync should remain only as a
reconciliation backstop.

**Blast radius:** cannot be assessed here. This repo holds no member data, no
audit log and no IdP activity log to query. The owning system must run the
audit **urgently**, because this is a live security exposure:

- [ ] List every member whose departure timestamp is earlier than their SSO
      revocation timestamp by more than the threshold (start at 15 minutes), or
      who has no revocation timestamp at all.
- [ ] Check the known incident (the departed member, about 3 weeks) against the
      query to validate it.
- [ ] Revoke any hits manually in the IdP, and document the audit in the PR
      description or a linked comment.

## Shared root cause assessment

**Determination: neither confirmed nor refuted in this repo.** Nothing here
could connect the two issues: no lifecycle service, no event bus, no database
transaction and no persistence layer. So this checkout cannot answer whether
BambooHR sync and SSO deprovisioning share one lifecycle service or are separate
subsystems with a similar failure mode.

**Common factor suggested by the linked evidence (for the owning team to
verify):** member status changes appear to be persisted by **hard delete** and
through **unvalidated fields**, not by an `is_active` soft-delete. A soft-delete
keeps the row, so downstream exports (the BambooHR CSV) and syncs (the IdP
nightly job) could still see the status change and act on it. If this is
confirmed, one fix (soft-delete, plus validated fields, plus revocation
dispatched on deactivation) would address both escalations.

## PR #60 review status

**PR #60 could not be reviewed.** The checkout was fetched without a remote.
`git remote -v` is empty and there are no PR refs or other branches, so the PR's
diff is not visible from here. To review it, get the diff from the owning
repository and check it against the list below.

**Reviewer checklist:**

- [ ] The code has a comment that documents the root cause, and the PR
      description names the defect for both escalations.
- [ ] Both paths are covered: the BambooHR import/export pipeline **and** the
      SSO deprovisioning on deactivation. Note which one is missing if only one
      is covered.
- [ ] Tests reproduce each failure condition. Each one fails on the pre-fix
      code and passes after the fix, including a test that deactivating a
      member dispatches the SSO/SCIM revocation within the SLA.
- [ ] Soft-delete behaviour: deactivated rows still appear in the export (with
      `is_active` false) but no longer appear in the active directory view.
- [ ] The audit of recently departed members (departure vs. revocation
      timestamps) is done and documented in the PR description or a linked
      comment.
- [ ] No regression in onboarding (BambooHR import of new employees), role
      updates or reactivation. The existing suite passes green.

**Explicit status:** PR #60 was **not reviewed**, and **no root cause was
confirmed** for either escalation in this investigation.
