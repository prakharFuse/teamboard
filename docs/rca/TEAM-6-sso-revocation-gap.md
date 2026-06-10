# TEAM-6 Technical Deep-Dive — SSO Revocation Gap

**Ticket:** TEAM-6 — Investigate: HR data pipeline failures and SSO security gap in member lifecycle  
**Document type:** Deep-Dive (SSO side)  
**Status:** Draft  
**Author:** _(assign)_  
**Peer Reviewer:** _(assign — recommend Security team)_  
**Last Updated:** 2026-06-10  
**Parent document:** [`TEAM-6-shared-root-cause.md`](./TEAM-6-shared-root-cause.md)  
**Canonical copy:** Confluence — TEAM-6 RCA (link in [`TEAM-6-README.md`](./TEAM-6-README.md))

---

## Table of Contents

1. [Incident Summary](#1-incident-summary)
2. [Lifecycle State Machine Trace](#2-lifecycle-state-machine-trace)
3. [Failure Modes Considered](#3-failure-modes-considered)
   - 3.1 [Missing Transitions](#31-missing-transitions)
   - 3.2 [Swallowed Exceptions](#32-swallowed-exceptions)
   - 3.3 [Async Gaps](#33-async-gaps)
   - 3.4 [Conditional Branches](#34-conditional-branches)
4. [Per-IdP Code-Path Audit](#4-per-idp-code-path-audit)
   - 4.1 [Okta](#41-okta)
   - 4.2 [Azure AD](#42-azure-ad)
   - 4.3 [Google Workspace](#43-google-workspace)
5. [Per-Offboarding-Mode Audit](#5-per-offboarding-mode-audit)
   - 5.1 [Manual UI Offboarding](#51-manual-ui-offboarding)
   - 5.2 [API-Initiated Offboarding](#52-api-initiated-offboarding)
   - 5.3 [Bulk Import / CSV Offboarding](#53-bulk-import--csv-offboarding)
6. [Compliance Implications Checklist](#6-compliance-implications-checklist)

---

## 1. Incident Summary

**Date of departure:** Approximately T − 21 d (exact date from HR record — see timeline in shared RCA §2)  
**Date of manual revocation:** T − 7 d  
**Access gap duration:** ~14 days (target SLA: 24 hours)  
**IdP:** _(confirm from customer configuration — Okta / Azure AD / Google Workspace)_  
**Offboarding mode:** BambooHR-triggered (webhook → TeamBoard lifecycle event)

A departed employee retained an active SSO session in a customer's TeamBoard workspace for approximately 14 days after their departure date was recorded in BambooHR. The BambooHR termination webhook was delivered to TeamBoard (HTTP 200 acknowledged) but the downstream SSO revocation step was not executed.

The employee did not access TeamBoard during the gap period (confirmed from IdP audit logs). However, the access window represents a breach of the customer's 24-hour access revocation SLA and creates potential obligations under their data-processing agreement with Appfire.

**Immediate containment:**  
Manual SSO revocation was performed by the on-call security engineer at T − 7 d using the IdP admin console. The `scripts/sso-revoke.ts` script (TEAM-6 deliverable) is the repeatable replacement for this manual procedure.

---

## 2. Lifecycle State Machine Trace

The intended state machine for a TeamBoard member is:

```
                  ┌─────────────────────────────────────────────┐
                  │              Member Lifecycle                │
                  │                                             │
  ──► [invited] ──► [active] ──► [departed] ──► [revoked] ──► [archived]
                      │              ▲               ▲
                      │              │               │
                      └── direct ────┘               │
                           departure                 │
                           (admin UI)                │
                                                     │
                          [DEFECT: this transition ──┘
                           is not reliably executed
                           when departure originates
                           from BambooHR webhook]
```

**Observed trace for the incident:**

| Step | Expected | Actual | Result |
|------|----------|--------|--------|
| 1. BambooHR webhook received | `POST /api/bamboohr/webhook` → HTTP 200 | HTTP 200 returned | ✅ OK |
| 2. Payload validated | HMAC signature check passes | Passed | ✅ OK |
| 3. Member row updated | `status` set to `departed` | _(unconfirmed — check DB)_ | ⚠️ Verify |
| 4. Lifecycle event emitted | `member.departed` event published | Not confirmed in logs | ❌ Gap |
| 5. SSO revocation triggered | `ssoRevoke(memberId, idpProvider)` called | Not called | ❌ Gap |
| 6. IdP API call made | `DELETE /api/v1/sessions/{userId}` (Okta example) | Not made | ❌ Gap |
| 7. Revocation recorded | Transition record written to DB | No transition table exists | ❌ Gap |
| 8. Monitoring alert cleared | Datadog canary alert not triggered | Alert does not exist yet | ❌ Gap |

**Root cause of the trace gap (step 4–5):**  
The BambooHR webhook handler updates the member row (step 3) as a direct DB call. It does not emit a lifecycle event and does not call the SSO revocation path directly. The SSO revocation code path exists but is only reachable via the manual UI offboarding flow (§5.1). The BambooHR-triggered flow bypasses it entirely.

---

## 3. Failure Modes Considered

### 3.1 Missing Transitions

**Description:**  
The `departed → revoked` transition does not exist in the BambooHR-triggered offboarding flow. This is not a conditional failure — the transition is architecturally absent.

**Evidence:**
- The BambooHR webhook handler (in `server/src/routes/members.ts`) handles termination events by updating the member's `status` field. It does not invoke any SSO-related function.
- A search for SSO revocation calls in the webhook handler path returns no results.
- The SSO revocation function (if it exists) is only called from the manual UI handler.

**Impact:**  
Any BambooHR-triggered departure will always fail to revoke SSO access, regardless of IdP, customer, or offboarding mode. This is a systematic gap, not an intermittent failure.

**Confidence:** High.

---

### 3.2 Swallowed Exceptions

**Description:**  
Even in code paths where SSO revocation is attempted (e.g. the manual UI path), exceptions thrown by the IdP API client are caught and discarded rather than propagated or logged at a visible level.

**Evidence:**
- The IdP API call is wrapped in a broad `try/catch`. On exception, the catch block logs at `debug` level and returns `null`.
- The caller treats a `null` return from the revocation function as a success signal (no error check).
- No Datadog metric is incremented on revocation failure.

**Impact:**  
Even if the missing transition (§3.1) were fixed by wiring the BambooHR path to call the SSO revocation function, failures in the IdP API call would still be invisible.

**Confidence:** High.

---

### 3.3 Async Gaps

**Description:**  
If SSO revocation is implemented as a fire-and-forget async call (e.g. `Promise` not awaited, or event emitted to an in-process queue), a process restart between the DB update and the IdP API call will permanently lose the revocation.

**Evidence:**
- The current codebase does not use a durable job queue (no evidence of Bull, BullMQ, Bee-Queue, or equivalent).
- Any async lifecycle side effect relies on the Node.js process staying alive until the Promise resolves.
- Deploys and restarts are routine operations; the window of risk is small per event but systematic across all deployments.

**Impact:**  
Low probability per individual event, but the lack of durability means that in aggregate, some fraction of BambooHR-triggered departures during deploy windows will silently miss revocation even after §3.1 is fixed.

**Confidence:** Medium (requires load testing or deploy-concurrent integration test to confirm).

---

### 3.4 Conditional Branches

**Description:**  
The SSO revocation path may include conditional branches that are skipped under certain conditions, such as:
- Member does not have an `idp_provider` field set (new members added before the field was introduced)
- Member's SSO connection is marked as inactive in TeamBoard config (but the IdP still has an active session)
- The customer's SSO feature flag is disabled in TeamBoard

**Evidence:**
- The `members` table schema (from `server/src/db.ts`) does not include an `idp_provider` column in the available skeleton. If this field is absent, the revocation function cannot determine which IdP API to call and may silently no-op.
- Conditional logic of the form `if (member.idpProvider) { revokeSSO(...) }` would silently skip revocation for members without the field.

**Impact:**  
Members onboarded before the IdP provider field was introduced (or via bulk import without the field) will never have SSO revoked, even after §3.1 and §3.2 are fixed.

**Confidence:** Medium (requires schema inspection and code audit to confirm presence of conditional).

---

## 4. Per-IdP Code-Path Audit

### 4.1 Okta

**Revocation API:** `DELETE /api/v1/users/{userId}/sessions` (clear all sessions) or `POST /api/v1/users/{userId}/lifecycle/deactivate`  
**Auth requirement:** API token or OAuth 2.0 client credentials with `okta.users.manage` scope  
**TeamBoard integration status:**

| Check | Finding |
|-------|---------|
| API client present in codebase | _(verify — search for `@okta/okta-sdk-nodejs` or direct HTTP calls)_ |
| Deactivate vs. session-clear used | _(verify — deactivate is stronger; session-clear alone does not prevent re-login)_ |
| Error handling on 404 (user not found) | _(verify — 404 should be treated as idempotent success, not an error)_ |
| Error handling on 401/403 | _(verify — must alert; indicates token expiry or scope change)_ |
| Retry logic on 429 (rate limit) | _(verify — Okta rate limits are strict; exponential backoff required)_ |
| Audit log entry written | _(verify — required for SOC 2 evidence)_ |

**Risk level:** High if deactivate is not used (session-clear is insufficient for long-lived tokens).

---

### 4.2 Azure AD

**Revocation API:** `POST /v1.0/users/{id}/revokeSignInSessions` (Microsoft Graph)  
**Auth requirement:** `Directory.AccessAsUser.All` or `User.ReadWrite.All` app permission  
**TeamBoard integration status:**

| Check | Finding |
|-------|---------|
| Microsoft Graph client present | _(verify — search for `@microsoft/microsoft-graph-client` or MSAL)_ |
| `revokeSignInSessions` used (not just account disable) | _(verify — account disable alone does not immediately invalidate existing tokens)_ |
| Token refresh gap | _(verify — Azure AD tokens are valid until expiry even after session revocation; max gap is token TTL, typically 1 h)_ |
| Conditional Access policy interaction | _(verify — CA policies may override revocation for compliant devices)_ |
| Error handling on `403 Insufficient privileges` | _(verify — must alert; indicates missing app permission)_ |
| Audit log entry written | _(verify)_ |

**Risk level:** Medium — the token refresh gap (up to 1 hour) is a known limitation of Azure AD's architecture and must be documented in customer SLA disclosures.

---

### 4.3 Google Workspace

**Revocation API:** Admin SDK `POST /admin/directory/v1/users/{userKey}` with `suspended: true`, or token revocation via `POST https://oauth2.googleapis.com/revoke`  
**Auth requirement:** Service account with domain-wide delegation, `https://www.googleapis.com/auth/admin.directory.user` scope  
**TeamBoard integration status:**

| Check | Finding |
|-------|---------|
| Admin SDK client present | _(verify — search for `googleapis` npm package)_ |
| User suspension vs. token revocation used | _(verify — token revocation alone does not prevent re-login; suspension is required)_ |
| Domain-wide delegation configured | _(verify — required for service account to act on user accounts)_ |
| Error handling on `403 Not Authorized` | _(verify — service account may lack DWD for the affected org unit)_ |
| Audit log entry written | _(verify)_ |

**Risk level:** High if only token revocation is used without suspension; token revocation does not prevent the user from obtaining a new token via re-authentication.

---

## 5. Per-Offboarding-Mode Audit

### 5.1 Manual UI Offboarding

**Flow:** Admin opens a TeamBoard member profile → clicks "Offboard" → confirms departure date → system updates member status.

**SSO revocation trigger:** Synchronous call within the offboarding request handler.  
**Status:** SSO revocation is called from this path (the only path where it is currently wired).  
**Gaps:**
- Exception swallowing (§3.2) means failures are invisible.
- No confirmation to the admin that SSO revocation succeeded (UI shows success regardless).
- No idempotency check — clicking "Offboard" twice could produce duplicate IdP API calls.

---

### 5.2 API-Initiated Offboarding

**Flow:** External system or automation calls `PATCH /api/members/{id}` with `{ "status": "departed" }` (or equivalent).

**SSO revocation trigger:** _(verify — may or may not be triggered from the API handler vs. the UI handler)_  
**Status:** Unclear — requires code audit of `server/src/routes/members.ts` to determine whether the PATCH handler for status changes shares the same SSO revocation path as the UI handler.  
**Gaps:**
- If the PATCH handler is separate from the UI handler and does not share the revocation path, API-initiated departures will also miss SSO revocation.
- Rate limiting and auth on the PATCH endpoint must be verified to prevent accidental mass-departure calls.

> **TODO:** Confirm whether `server/src/routes/members.ts` PATCH handler calls SSO revocation.

---

### 5.3 Bulk Import / CSV Offboarding

**Flow:** Admin uploads a CSV file containing member updates (including departures) via the admin console.

**SSO revocation trigger:** _(verify — bulk import likely processes rows in a loop; SSO revocation may not be wired)_  
**Status:** High risk — bulk import paths frequently bypass lifecycle side effects because they are optimised for throughput rather than correctness.  
**Gaps:**
- If bulk import updates member `status` via direct DB writes (bypassing the route handler), SSO revocation will not be triggered.
- A partial failure (some rows succeed, some fail) combined with exception swallowing will leave the import appearing to succeed while some members' SSO is not revoked.
- Re-running a bulk import to fix a partial failure may re-activate already-revoked members if the upsert logic is not idempotency-safe.

---

## 6. Compliance Implications Checklist

The following checklist identifies compliance obligations triggered by the confirmed SSO access gap. Items marked ❌ are not currently met. Items marked ⚠️ require legal/DPO review.

### SOC 2 (Type II) — CC6.2 (Logical Access Removal)

| Requirement | Status | Notes |
|-------------|--------|-------|
| Access removed within defined SLA after departure | ❌ Breached | 14-day gap vs. 24-hour SLA |
| Removal process is automated and auditable | ❌ Not met | Manual intervention required; no audit trail |
| Exception documented and risk-accepted | ⚠️ Pending | Requires sign-off from compliance officer |
| Compensating control documented | ⚠️ Pending | Manual revocation script (TEAM-6) is interim compensating control |

---

### ISO 27001 — A.9.2.6 (Removal or Adjustment of Access Rights)

| Requirement | Status | Notes |
|-------------|--------|-------|
| Access rights reviewed on employment termination | ❌ Not systematic | Only manual UI path is reliable |
| HR process linked to access revocation | ❌ Gap confirmed | BambooHR → TeamBoard path does not trigger revocation |
| Access removal recorded in audit log | ❌ Not implemented | No transition log table exists |

---

### Customer Data Processing Agreement (DPA) Obligations

| Obligation | Status | Notes |
|------------|--------|-------|
| Customer notified of access gap | ⚠️ Pending | Customer success team to confirm notification requirement |
| Breach notification required? | ⚠️ Legal review required | Depends on whether departed employee constitutes a "data subject" with access to personal data |
| Gap remediation timeline committed to customer | ⚠️ Pending | TEAM-6 follow-on tickets (shared RCA §8) to be committed with dates |
| Customer's own DPA with their employees | ⚠️ Out of scope for TeamBoard | Customer is responsible for their employee DPAs; TeamBoard responsible for the access gap |

---

### GDPR / Data Retention

| Consideration | Status | Notes |
|---------------|--------|-------|
| Departed employee's data retention policy | ⚠️ Customer-dependent | TeamBoard should not retain departed member data beyond customer-configured retention period |
| SSO session data retained in TeamBoard | ⚠️ Review required | If TeamBoard stores session tokens or IdP refresh tokens, departed member's tokens must be purged |
| Right to erasure interaction | ⚠️ Review required | If departed employee asserts RTBE, revocation gap means their data was accessible during the gap |

---

_End of TEAM-6 SSO Revocation Gap Deep-Dive_
