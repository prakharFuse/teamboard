# Technical Deep-Dive — BambooHR Pipeline Failures (TEAM-6)

| Field           | Value                             |
|-----------------|-----------------------------------|
| **Parent RCA**  | [TEAM-6-rca.md](TEAM-6-rca.md)   |
| **Owner**       | `[TBC]`                           |
| **Status**      | Draft — evidence pending          |
| **Last updated**| 2026-06-10                        |

---

## Table of Contents

1. [Background](#1-background)
2. [Pipeline Architecture Overview](#2-pipeline-architecture-overview)
3. [Stage-by-Stage Analysis](#3-stage-by-stage-analysis)
   - [Stage 1 — Auth / Token Refresh](#stage-1--auth--token-refresh)
   - [Stage 2 — Fetch Employee List](#stage-2--fetch-employee-list)
   - [Stage 3 — Field Mapping / Normalisation](#stage-3--field-mapping--normalisation)
   - [Stage 4 — Upsert into TeamBoard DB](#stage-4--upsert-into-teamboard-db)
   - [Stage 5 — Post-import Audit Emission](#stage-5--post-import-audit-emission)
4. [Hypothesised Failure Modes](#4-hypothesised-failure-modes)
5. [Evidence Required](#5-evidence-required)
6. [Payload Reproduction Protocol](#6-payload-reproduction-protocol)
7. [Customer-Side vs TeamBoard-Side Classification](#7-customer-side-vs-teamboard-side-classification)
8. [Open Questions](#8-open-questions)

---

## 1. Background

TeamBoard exposes a CSV export at `GET /api/members/export` that downstream HR integrations (including BambooHR) can consume. In the reverse direction, some accounts have a **BambooHR → TeamBoard import pipeline** configured: a scheduled job pulls employee records from the BambooHR API and upserts them into the `members` table via the TeamBoard API.

At least **four customer accounts** (A–D, IDs TBC) reported anomalies consistent with import pipeline failures. The symptoms fall into three categories:

1. **Missing members** — employees present in BambooHR but absent from TeamBoard after a scheduled sync.
2. **Stale data** — role or department fields in TeamBoard do not reflect recent BambooHR changes.
3. **Silent failure** — the import job completed without error but records were not updated.

---

## 2. Pipeline Architecture Overview

```
BambooHR API
    │
    ▼
[Scheduled Import Job]
    ├─ Stage 1: Auth / Token Refresh
    ├─ Stage 2: GET /v1/employees/directory  (BambooHR REST)
    ├─ Stage 3: Field mapping + normalisation
    ├─ Stage 4: POST/PATCH /api/members      (TeamBoard API)
    └─ Stage 5: Audit log emission
                    │
                    ▼
            TeamBoard SQLite (members table)
```

> **Note:** The exact job runtime (cron schedule, hosting environment) is `[TBC]` — confirm with the platform/infra team.

---

## 3. Stage-by-Stage Analysis

### Stage 1 — Auth / Token Refresh

**Description:** The import job authenticates with BambooHR using an API key or OAuth token stored in environment config.

**Hypothesised failure modes:**
- Expired or rotated API key not updated in the job's secret store → all subsequent BambooHR calls return `401 Unauthorized`.
- Network timeout during token refresh → job aborts silently if error is caught-and-swallowed at this stage.

**Observable signal:** BambooHR API `401` / `403` responses in job logs. Absence of any log line after the auth attempt would indicate a swallowed exception.

---

### Stage 2 — Fetch Employee List

**Description:** The job calls `GET /v1/employees/directory` (or equivalent) on the BambooHR API to retrieve the current employee roster.

**Hypothesised failure modes:**
- BambooHR API returns a paginated response but the job does not iterate all pages → only first N employees are processed.
- BambooHR API rate-limit (`429 Too Many Requests`) triggers a retry loop that exceeds the job timeout → partial dataset committed.
- Schema drift: BambooHR changed a field name (e.g. `workEmail` → `workEmailAddress`) → downstream mapping silently drops records or produces null fields.

**Observable signal:** Compare record count from BambooHR API response vs records upserted in TeamBoard for the same sync run.

---

### Stage 3 — Field Mapping / Normalisation

**Description:** BambooHR field names are mapped to TeamBoard column names: `firstName`+`lastName` → `name`, `jobTitle` → `role`, `department` → `department`, `hireDate` → `start_date`, `workEmail` → `email`.

**Hypothesised failure modes:**
- Missing or null BambooHR field → mapped to `null` → TeamBoard rejects with `400 Bad Request` if field is required, or silently stores `null` if field is optional (stale data symptom).
- Email normalisation (lowercasing, trimming) applied inconsistently → duplicate detection in TeamBoard fails → insert attempted for existing member → `409 Conflict` returned → record skipped without update.
- `start_date` format mismatch (BambooHR uses `YYYY-MM-DD`; if TeamBoard expects ISO-8601 with time component) → date stored incorrectly or insert rejected.

**Observable signal:** Validate mapping function output against real payloads from affected accounts (see §6 Payload Reproduction Protocol).

---

### Stage 4 — Upsert into TeamBoard DB

**Description:** For each normalised record, the job calls `POST /api/members` (create) or `PATCH /api/members/:id` (update) on the TeamBoard API. The match key is email address.

**Hypothesised failure modes (F-1 through F-5):**

| ID  | Description                                                                                      | Symptom          |
|-----|--------------------------------------------------------------------------------------------------|------------------|
| F-1 | `POST /api/members` returns `409` for existing email; job does not fall back to `PATCH`         | Missing update   |
| F-2 | `PATCH /api/members/:id` called with wrong/stale member ID (ID drift after delete+recreate)     | Stale data       |
| F-3 | TeamBoard API returns `5xx`; job swallows error and marks record as processed                    | Silent failure   |
| F-4 | Concurrent import runs for same account; second run overwrites first before commit               | Data corruption  |
| F-5 | SQLite write fails under load (locked database); TeamBoard returns `500`; job does not retry     | Missing members  |

**Observable signal:** TeamBoard API access logs for `POST /api/members` and `PATCH /api/members/:id` during the sync window. Look for `4xx`/`5xx` status codes.

---

### Stage 5 — Post-import Audit Emission

**Description:** After each record is processed, the job should emit a structured audit log entry (member ID, action, timestamp, source=bamboohr, success/failure, error reason).

**Hypothesised failure modes:**
- **This stage does not exist yet.** The current codebase has no per-record audit emission in the import pipeline. This is the single highest-leverage instrumentation gap: without it, forensic investigation of any failure mode above requires log archaeology rather than a direct audit query.

**Observable signal:** Absence of audit records is itself the evidence — confirms this stage is not implemented.

---

## 4. Hypothesised Failure Modes

Consolidated ranked list (by likelihood based on available evidence):

| Rank | ID  | Stage   | Hypothesis                                           | Confidence | Blocking evidence needed          |
|------|-----|---------|------------------------------------------------------|------------|-----------------------------------|
| 1    | F-3 | Stage 4 | Swallowed `5xx` errors — job treats all errors as success | High  | Job source code review            |
| 2    | F-1 | Stage 4 | `POST`→`409` not retried as `PATCH`                  | High       | Job source code review            |
| 3    | —   | Stage 5 | No audit log → failures invisible                    | Confirmed  | Codebase inspection (no audit)    |
| 4    | F-2 | Stage 4 | ID drift after delete+recreate cycle                 | Medium     | Member ID history query           |
| 5    | —   | Stage 2 | Pagination not implemented → first page only         | Medium     | Compare BambooHR count vs synced  |
| 6    | —   | Stage 3 | Schema drift in BambooHR payload                     | Low-Medium | Payload capture from affected acct|

---

## 5. Evidence Required

The following evidence must be collected before the failure modes can be confirmed or ruled out.

| # | Evidence item                                                                                        | Source                                   | Assigned to | Status      |
|---|------------------------------------------------------------------------------------------------------|------------------------------------------|-------------|-------------|
| 1 | Import job source code (or build artefact) for version running during the failure window             | Infra / platform team                    | `[TBC]`     | Not started |
| 2 | Import job execution logs for affected accounts (A–D) during the failure window                      | Log aggregator (e.g. Datadog / CloudWatch)| `[TBC]`    | Not started |
| 3 | TeamBoard API access logs: `POST /api/members`, `PATCH /api/members/:id` for same window             | TeamBoard application logs               | `[TBC]`     | Not started |
| 4 | Raw BambooHR API response payloads for affected accounts (see §6 for safe capture method)            | BambooHR account credentials (per-tenant)| `[TBC]`    | Not started |
| 5 | Count of employees in BambooHR vs count in TeamBoard immediately after a failed sync                 | BambooHR admin console + TeamBoard DB    | `[TBC]`     | Not started |
| 6 | SQLite `members` table row history for affected accounts (soft-delete records, updated_at timestamps)| TeamBoard DB read replica                | `[TBC]`     | Not started |
| 7 | Confirm whether pagination is implemented in the import job (`X-Total-Count` header handling)        | Import job source code                   | `[TBC]`     | Not started |

---

## 6. Payload Reproduction Protocol

To reproduce and validate failure modes without touching production data:

1. **Capture a reference payload** from a BambooHR sandbox account (or a consenting affected account with test data only) using:

   ```bash
   curl -u "<API_KEY>:x" \
     "https://api.bamboohr.com/api/gateway.php/<subdomain>/v1/employees/directory" \
     -H "Accept: application/json" \
     > bamboohr-payload-sample.json
   ```

2. **Run the normalisation function** (Stage 3) against the captured payload in isolation. Log all null/missing fields:

   ```bash
   # Pseudocode — adapt to actual import job runtime
   node scripts/bamboohr-normalise.js bamboohr-payload-sample.json --log-nulls
   ```

3. **Replay against a local TeamBoard instance** with `TEAMBOARD_DB_PATH=':memory:'`:

   ```bash
   TEAMBOARD_DB_PATH=':memory:' node scripts/bamboohr-replay.js bamboohr-payload-sample.json
   ```

4. **Compare record counts** before and after replay. Any delta between BambooHR employee count and TeamBoard member count is a concrete reproduction of the bug.

5. **Iterate per failure mode**: manipulate the payload to simulate schema drift (rename a field), pagination truncation (truncate array to first 10 records), and ID collision (duplicate email with different ID) to confirm which modes the job defends against.

> **Data privacy note:** All payload captures must use anonymised or synthetic data unless the customer has provided explicit written consent. Record consent status in the blast-radius table in [TEAM-6-rca.md § 6.1](TEAM-6-rca.md#61-bamboohr--affected-customers).

---

## 7. Customer-Side vs TeamBoard-Side Classification

Not every reported failure originates in TeamBoard. This table classifies each known symptom by where the root cause is most likely to lie.

| Symptom reported                              | Likely root cause location  | Rationale                                                                          | Action required                        |
|-----------------------------------------------|-----------------------------|------------------------------------------------------------------------------------|----------------------------------------|
| Missing members after scheduled sync          | TeamBoard-side (F-1 or F-3) | If BambooHR export confirms member exists, failure is in import/upsert stage       | Instrument Stage 4; check job error handling |
| Stale role/department data                    | TeamBoard-side (F-1 or F-2) | TeamBoard not receiving update; likely `POST`→`409` with no `PATCH` fallback       | Review upsert logic in import job      |
| Silent failure — no error surfaced            | TeamBoard-side (F-3)        | Classic swallowed-exception pattern; job reports success regardless of API status  | Audit error-handling in job            |
| Partial import — some records missing         | Either side                 | Could be BambooHR pagination cutoff (customer-side) or TeamBoard `4xx` drops       | Compare counts; check pagination       |
| Members duplicated in TeamBoard               | TeamBoard-side (F-4)        | Concurrent import runs; no deduplication guard at DB level                         | Add unique constraint on email + account |
| Import job never ran (no logs at all)         | Customer-side               | Scheduler misconfiguration or credential expiry on customer's side                 | Confirm with customer; out of scope for this RCA |
| BambooHR shows employee as inactive but sync pushed as active | Customer-side | BambooHR employment status field not mapped or not sent in payload | Confirm field inclusion in payload     |

---

## 8. Open Questions

| # | Question                                                                                          | Owner   | Status      |
|---|---------------------------------------------------------------------------------------------------|---------|-------------|
| 1 | Does the import job run in TeamBoard's infra or is it a customer-operated connector?              | `[TBC]` | Open        |
| 2 | Is there a webhook mode (BambooHR pushes to TeamBoard) vs a polling mode (TeamBoard pulls)?       | `[TBC]` | Open        |
| 3 | What is the retry policy on `5xx` responses from TeamBoard?                                       | `[TBC]` | Open        |
| 4 | Is the import job version-controlled in this repo or a separate service?                          | `[TBC]` | Open        |
| 5 | Are there per-account import configs that could diverge (e.g. different field mappings per tenant)?| `[TBC]`| Open        |
