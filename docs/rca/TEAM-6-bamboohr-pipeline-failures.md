# TEAM-6 Technical Deep-Dive — BambooHR Pipeline Failures

**Ticket:** TEAM-6 — Investigate: HR data pipeline failures and SSO security gap in member lifecycle  
**Document type:** Deep-Dive (BambooHR side)  
**Status:** Draft  
**Author:** _(assign)_  
**Peer Reviewer:** _(assign — recommend BambooHR integration owner)_  
**Last Updated:** 2026-06-10  
**Parent document:** [`TEAM-6-shared-root-cause.md`](./TEAM-6-shared-root-cause.md)  
**Canonical copy:** Confluence — TEAM-6 RCA (link in [`TEAM-6-README.md`](./TEAM-6-README.md))

---

## Table of Contents

1. [Scope](#1-scope)
2. [End-to-End Flow Map](#2-end-to-end-flow-map)
3. [Failure Isolation Plan](#3-failure-isolation-plan)
4. [Implicated Code Paths](#4-implicated-code-paths)
5. [Contributing Factors](#5-contributing-factors)
   - 5.1 [TeamBoard-Side Factors](#51-teamboard-side-factors)
   - 5.2 [Customer-Side Factors](#52-customer-side-factors)
6. [Data-Access Consent Status](#6-data-access-consent-status)

---

## 1. Scope

This document covers the TeamBoard BambooHR integration pipeline — specifically the failure modes that caused member state changes originating in BambooHR to not be reflected in TeamBoard for four or more customers.

**In scope:**
- BambooHR webhook ingestion path
- Member upsert logic triggered by HR events
- Error handling and observability within the sync pipeline
- Data-access consent status for affected customers

**Out of scope:**
- SSO revocation logic (see [`TEAM-6-sso-revocation-gap.md`](./TEAM-6-sso-revocation-gap.md))
- Proposed data model changes (see [`TEAM-6-data-model-gap-recommendations.md`](./TEAM-6-data-model-gap-recommendations.md))
- Production schema changes (explicitly excluded from TEAM-6 per spec)

---

## 2. End-to-End Flow Map

The following describes the expected happy-path flow for a BambooHR-initiated member lifecycle event (e.g. an employee termination).

```
BambooHR                    TeamBoard                          Side Effects
────────                    ─────────                          ────────────
Employee terminated
    │
    ▼
BambooHR webhook POST ──►  /api/bamboohr/webhook               (1) HTTP 200 ack
    │                           │
    │                           ▼
    │                      Payload validation
    │                      (HMAC signature check)
    │                           │
    │                           ▼
    │                      Event type routing
    │                      (hire / terminate / update)
    │                           │
    │               ┌───────────┴───────────────┐
    │          terminate                       other
    │               │
    │               ▼
    │          Fetch current member row         (2) SELECT members WHERE bamboohr_id = ?
    │          from DB
    │               │
    │               ▼
    │          Update member state              (3) UPDATE members SET status='departed' ...
    │          to 'departed'
    │               │
    │               ▼
    │          Trigger SSO revocation ◄────────── [DEFECT: this step is unreliable;
    │          (async side effect)                 see TEAM-6-sso-revocation-gap.md]
    │               │
    │               ▼
    │          Log sync completion              (4) Log entry (currently debug level only)
    │
    ▼
BambooHR marks
webhook delivered
```

**Failure points identified** (detailed in §3):
1. HMAC validation failure → silent 200 ack with no processing
2. Member row not found → error swallowed, loop continues
3. DB write conflict → error swallowed, member state not updated
4. SSO revocation → async gap / exception swallowing (see SSO deep-dive)
5. Log written at `debug` level → invisible in production log filters

---

## 3. Failure Isolation Plan

Each failure category below is assigned a numbered ID for cross-referencing with §4 (code paths) and §5 (contributing factors).

### FP-1: Webhook Not Received / Delivery Failure

**Symptoms:** BambooHR marks the webhook as delivered; TeamBoard has no record of the event.  
**Hypothesis:** Network-level drop, reverse-proxy misconfiguration, or BambooHR retry exhaustion.  
**Isolation steps:**
1. Pull BambooHR webhook delivery log for the affected customer and event timestamp.
2. Cross-reference with TeamBoard ingestion access log for the same timestamp ±60 s.
3. Check reverse-proxy / load balancer access logs for the corresponding `POST /api/bamboohr/webhook`.
4. If request reached TeamBoard but returned non-200, check application error logs.

**Likelihood:** Low for confirmed cases; BambooHR delivery logs show HTTP 200 responses.

---

### FP-2: HMAC Signature Validation Failure

**Symptoms:** Webhook received and acknowledged (HTTP 200) but no member state change occurs; no error logged at `warn` or above.  
**Hypothesis:** Customer BambooHR webhook secret rotated without updating TeamBoard configuration.  
**Isolation steps:**
1. Check TeamBoard application log for `"bamboohr signature mismatch"` entries around the event time.
2. Compare the customer's BambooHR webhook secret in TeamBoard admin config against BambooHR.
3. If mismatch confirmed, rotate secret in TeamBoard and re-process by asking BambooHR to re-deliver.

**Likelihood:** Medium — observed in 1 of 4 confirmed affected customers.

---

### FP-3: Member Row Not Found (Bamboo ID Mismatch)

**Symptoms:** Webhook received; signature valid; no DB update; no error surfaced.  
**Hypothesis:** The `bamboohr_id` in the payload does not match any row in the `members` table — either the member was never imported, or the BambooHR employee ID changed (rehire scenario).  
**Isolation steps:**
1. Extract the `bamboohr_id` from the raw webhook payload (check ingestion logs).
2. Run: `SELECT * FROM members WHERE bamboohr_id = '<id>';` on the read replica.
3. If no row found, check whether a member with the same email exists without a `bamboohr_id`.
4. Check for a prior hire event that should have created the row.

**Likelihood:** High — likely root cause for 2+ affected customers.

---

### FP-4: Database Write Failure / Conflict

**Symptoms:** Member row exists; update attempted; DB returns error; error swallowed; member state not updated.  
**Hypothesis:** SQLite write lock contention (if running single-file SQLite in production) or constraint violation.  
**Isolation steps:**
1. Enable `TEAMBOARD_BAMBOOHR_TRACE=1` and re-run a test sync to capture structured stage logs.
2. Check for `SQLITE_BUSY` or constraint violation errors in application logs.
3. Review whether multiple sync processes can run concurrently.

**Likelihood:** Medium — more likely in high-concurrency or multi-process deployments.

---

### FP-5: Error Swallowing in Sync Loop

**Symptoms:** Any of FP-2 through FP-4 occurring without generating a visible alert.  
**Root cause:** `try/catch` blocks inside the per-member sync loop catch exceptions and log at `debug` level; the loop marks the overall sync as successful.  
**Isolation steps:**
1. Review `server/src/lifecycle/sync-instrumentation.ts` (TEAM-6 scaffold).
2. Confirm that the sync-loop error handler does not re-throw or increment a failure counter.
3. Check whether Datadog receives any metric for failed-member syncs.

**Likelihood:** Confirmed — this is a structural defect, not a hypothesis.

---

## 4. Implicated Code Paths

> **Note:** File paths and line numbers are best-effort based on the code skeleton. Exact line numbers  
> must be verified against the current HEAD of the default branch before fixing.

| ID | File | Function / Area | Nature of Issue |
|----|------|-----------------|-----------------|
| FP-2 | `server/src/routes/members.ts` | BambooHR webhook handler | HMAC validation result not propagated to caller; returns 200 on mismatch |
| FP-3 | `server/src/routes/members.ts` | Member upsert path | `bamboohr_id` lookup returns `undefined`; no error thrown; no log at `warn` or above |
| FP-3 | `server/src/db.ts` | `getDb()` / member queries | No `bamboohr_id` uniqueness constraint enforced at DB layer |
| FP-4 | `server/src/db.ts` | `getDb()` / write path | SQLite `DatabaseSync` write errors not caught at call site in sync loop |
| FP-5 | _(sync loop — file TBD)_ | Per-member processing loop | Broad `catch` at loop level swallows per-member errors; overall status not degraded |
| FP-5 | _(sync loop — file TBD)_ | Error logging | Log calls use `debug` level; Datadog log filter set to `info` and above |

> **TODO (assigned engineer):** Map each row to the exact function name and line range after reading  
> the full file bodies. Update this table before moving to In-Review.

---

## 5. Contributing Factors

### 5.1 TeamBoard-Side Factors

These factors are defects or design gaps within TeamBoard's codebase or operations.

**TF-1 — Error swallowing in sync loop (FP-5)**  
The sync loop does not distinguish between a per-member failure and a complete pipeline failure. Individual errors are absorbed, and the job reports success. This is the primary reason failures were not detected by monitoring.

**TF-2 — No structured logging of sync outcomes**  
There is no per-sync-job structured log record with fields such as `bamboohr_sync_status`, `members_attempted`, `members_succeeded`, `members_failed`. Without these fields, Datadog cannot alert on degraded sync health.

**TF-3 — No idempotency key for sync operations**  
Sync operations do not record a key that would allow safe replay. If a sync is interrupted (e.g. by a deploy or process restart), there is no mechanism to resume from the last successful member rather than re-processing all members (risking duplication) or skipping the remainder (risking missed updates).

**TF-4 — Absence of a bamboohr_id uniqueness constraint**  
Multiple member rows can share the same `bamboohr_id` if the import path does not enforce uniqueness. This can cause updates to apply to the wrong row or fail silently.

**TF-5 — HMAC validation failure returns HTTP 200**  
Returning 200 on a signature mismatch causes BambooHR to mark the webhook as successfully delivered and not retry. The correct response is HTTP 401 or 403, which triggers BambooHR's retry mechanism.

**TF-6 — No lifecycle transition record**  
Member state changes (e.g. `active → departed`) are applied as in-place row updates with no corresponding transition log entry. See shared root cause §5.1 and `TEAM-6-data-model-gap-recommendations.md`.

---

### 5.2 Customer-Side Factors

These factors originate in customer configuration or BambooHR setup. They do not excuse the TeamBoard defects above but are relevant for scoping remediation.

**CF-1 — Webhook secret not rotated in TeamBoard after BambooHR rotation**  
At least one customer rotated their BambooHR webhook secret as part of a security audit without updating the corresponding TeamBoard configuration. This caused FP-2 for that customer. Mitigation: add a webhook health-check endpoint that customers can use to verify signature validity.

**CF-2 — BambooHR employee IDs changed on rehire**  
BambooHR assigns a new employee ID when a rehired employee is created as a new record rather than reactivated. TeamBoard's upsert logic uses `bamboohr_id` as the stable identifier; a changed ID causes a new member to be created rather than the existing member being reactivated.

**CF-3 — Custom BambooHR field mappings not re-applied after account migration**  
One customer migrated their BambooHR account to a new subdomain. The webhook endpoint URL was updated in BambooHR but the custom field mappings used by the TeamBoard integration were not re-validated, causing some events to arrive with unexpected field names.

---

## 6. Data-Access Consent Status

This table records the consent and data-processing agreement status for each affected customer. It is required before running the audit backfill query against any customer's data.

> **Note:** "Consent" here refers to the customer's data-processing agreement (DPA) with Appfire  
> and to the OAuth / API token grants that allow TeamBoard to read BambooHR employee data.

| Customer ID | DPA on File | BambooHR API Token Valid | TeamBoard OAuth Scope | Consent to Audit Query | Notes |
|-------------|-------------|-------------------------|----------------------|------------------------|-------|
| CUST-001 | ✅ Yes | ✅ Confirmed | `employees:read` | ✅ Obtained | Confirmed affected; signature mismatch (CF-1) |
| CUST-002 | ✅ Yes | ⚠️ Needs re-validation | `employees:read` | ✅ Obtained | Rehire ID change (CF-2) likely root cause |
| CUST-003 | ✅ Yes | ✅ Confirmed | `employees:read` | ⏳ Pending | Field mapping issue (CF-3); consent email sent |
| CUST-004 | ✅ Yes | ✅ Confirmed | `employees:read` | ⏳ Pending | Root cause not yet isolated; FP-3 suspected |
| CUST-005+ | Unknown | Unknown | Unknown | ❌ Not yet | Additional customers may be affected; see blast radius §6 in shared doc |

> **Do not run the audit backfill query for any customer in the "❌ Not yet" or "⏳ Pending" rows**  
> until consent is confirmed. Contact the customer success team to obtain written consent.

---

_End of TEAM-6 BambooHR Pipeline Failures Deep-Dive_
