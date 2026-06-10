# Runbook — Manual SSO Revocation for Departed Members

| Field              | Value                                                        |
|--------------------|--------------------------------------------------------------|
| **Runbook ID**     | RB-SSO-001                                                   |
| **Related RCA**    | [TEAM-6-rca.md](../rca/TEAM-6-rca.md)                       |
| **Related ticket** | TEAM-9 *(permanent fix — automated hook; not yet shipped)*   |
| **Owner**          | prakhar.srivastav@appfire.com                                |
| **Last updated**   | 2026-06-10                                                   |
| **Status**         | Active — required until TEAM-9 ships the automated hook      |

> **Scope:** This runbook covers the *manual* remediation path only. It is required because the `DELETE /api/members/:id` handler does not yet trigger an automated IdP deprovisioning call (confirmed root cause S-1). Once TEAM-9 ships and is verified in production, this runbook's scope narrows to **historical gap remediation** only; new offboardings will be handled automatically.

---

## Table of Contents

1. [When to Use This Runbook](#1-when-to-use-this-runbook)
2. [Prerequisites](#2-prerequisites)
3. [Procedure](#3-procedure)
4. [Idempotency Guarantees](#4-idempotency-guarantees)
5. [Audit Trail Location](#5-audit-trail-location)
6. [Per-Account Application-Log Template](#6-per-account-application-log-template)
7. [Rollback Steps](#7-rollback-steps)
8. [Escalation Path](#8-escalation-path)
9. [Post-Execution Checklist](#9-post-execution-checklist)

---

## 1. When to Use This Runbook

Use this runbook in any of the following situations:

| Trigger                                                                                          | Source                                                          |
|--------------------------------------------------------------------------------------------------|-----------------------------------------------------------------|
| Blast-radius SQL (`scripts/audit-backfill-query.sql`) surfaces a member with `sso_revoked_at IS NULL` and departure event recorded | Scheduled or ad-hoc audit run |
| Support ticket reports a departed employee is still able to authenticate via SSO                 | Support escalation                                              |
| Security team detects an anomalous active session for a known-departed member                   | Security monitoring / `monitoring/stale-sso-session-monitor.yaml` |
| Manual offboarding is being processed and TEAM-9 automated hook is not yet live                 | Normal offboarding workflow                                     |

---

## 2. Prerequisites

Complete all checks before starting Step 3. Do **not** proceed until every prerequisite is satisfied.

### 2.1 Access and credentials

| # | Prerequisite                                                                                                  | Notes                                                             |
|---|---------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------|
| 1 | **IdP admin access** for the account's Identity Provider (Okta / Azure AD / Google Workspace)                | Read the account's `idp_provider` from TeamBoard DB or account config; if `NULL` see §8 escalation |
| 2 | **TeamBoard DB read access** (read replica preferred; never write to production DB directly in this runbook)  | Required to confirm member deletion and look up the member's email and account ID |
| 3 | **Access to TeamBoard application logs** (e.g. Datadog, CloudWatch, or equivalent)                           | Required to record the audit log entry (§6) after each revocation |
| 4 | **Jira or incident tracker** open for this revocation batch                                                   | All revocations must be traceable to a ticket; record the ticket ID in every log entry |

### 2.2 Information required per member

Collect the following before revoking each member's SSO. Record these in the per-account log template (§6).

| Field                 | Where to find it                                                                    |
|-----------------------|-------------------------------------------------------------------------------------|
| `member_id`           | TeamBoard `members` table, or from blast-radius SQL output                          |
| `account_id`          | TeamBoard `members.account_id` column                                               |
| `email`               | TeamBoard `members.email` column                                                    |
| `idp_provider`        | TeamBoard `members.idp_provider` column; `COALESCE(…, 'UNKNOWN')` until TEAM-8 ships |
| `departure_event_at`  | Timestamp of the `DELETE /api/members/:id` call from TeamBoard access logs          |
| `operator`            | Your name / username — the person executing this runbook step                       |
| `ticket_id`           | Jira / incident tracker ID for this revocation batch                                |

### 2.3 Tooling (optional but recommended)

The idempotent script skeleton at `scripts/sso-revoke.ts` can perform the IdP API calls programmatically once the TODO-marked IdP client stubs are implemented. Until the stubs are filled in, the script operates in `--dry-run` mode only and is useful for pre-flight validation. For fully manual revocation, use the IdP consoles described in Step 3.

---

## 3. Procedure

Perform these steps **once per affected member**. Do not batch multiple members into a single IdP action (e.g. bulk-suspend); this prevents partial completion being misread as full completion (patchwork-state risk — see §6).

---

### Step 1 — Confirm TeamBoard member record is deleted

1. Query TeamBoard DB read replica:
   ```sql
   SELECT id, email, account_id, deleted_at
   FROM   members
   WHERE  id = '<member_id>';
   ```
2. Expected result: **zero rows** (hard-delete) or a row with a non-null `deleted_at` (soft-delete, if applicable).
3. If the member record still exists (row present, no `deleted_at`): **stop**. The TeamBoard offboarding is incomplete. Escalate to the engineering on-call before proceeding (§8). Revoking SSO while the member record exists may cause inconsistency.

---

### Step 2 — Identify the IdP in use for the account

1. Check `members.idp_provider` from the blast-radius SQL output or account config table.
2. If `idp_provider` is `NULL` or `UNKNOWN`: proceed to §8 escalation path item #3 to determine the correct IdP before continuing.
3. Record the confirmed IdP in the per-account log template (§6).

---

### Step 3 — Revoke SSO access in the IdP

Follow the sub-procedure for the account's IdP. Complete **only** the sub-procedure that matches the confirmed IdP — do not perform steps for other IdPs.

#### 3a. Okta

1. Sign in to the Okta Admin Console (`https://<org>.okta.com/admin`).
2. Navigate to **Directory → People**.
3. Search for the member's email address.
4. Confirm the display name and account match the departed member.
5. Click the member's name to open their profile.
6. Click **More Actions → Deactivate**.
7. Confirm the deactivation in the dialog.
8. **Verify:** The member's status must show **Deactivated** before proceeding to Step 4.
9. (If the member was already **Deactivated** before this step: this is idempotent — record the finding in the log template and continue to Step 4.)

**API equivalent** (if using `scripts/sso-revoke.ts` once stubs are implemented):
```
POST /api/v1/users/<okta_user_id>/lifecycle/deactivate
```

---

#### 3b. Azure Active Directory

1. Sign in to the Azure portal (`https://portal.azure.com`).
2. Navigate to **Azure Active Directory → Users**.
3. Search for the member's email (UPN).
4. Confirm the display name and account match the departed member.
5. Click the member's name to open their profile.
6. Under **Settings**, set **Block sign-in** to **Yes**.
7. Click **Save**.
8. **Verify:** The **Sign-in blocked** field must show **Yes** before proceeding to Step 4.
9. (If sign-in was already blocked: idempotent — record and continue.)

**API equivalent** (MS Graph):
```http
PATCH https://graph.microsoft.com/v1.0/users/<user_id>
Content-Type: application/json

{ "accountEnabled": false }
```

---

#### 3c. Google Workspace

1. Sign in to the Google Admin Console (`https://admin.google.com`).
2. Navigate to **Directory → Users**.
3. Search for the member's email address.
4. Confirm the display name matches the departed member.
5. Click the member's name to open their profile.
6. Click **More options (⋮) → Suspend user**.
7. Confirm the suspension in the dialog.
8. **Verify:** The member's account status must show **Suspended** before proceeding to Step 4.
9. (If the user was already suspended: idempotent — record and continue.)

**API equivalent** (Admin SDK):
```
PATCH https://admin.googleapis.com/admin/directory/v1/users/<user_key>
Body: { "suspended": true }
```

---

### Step 4 — Invalidate existing sessions (if supported)

Active sessions / tokens may persist even after account deactivation, for up to 24 hours depending on the IdP and the token expiry configuration (failure hypothesis S-5). Where the IdP supports immediate session revocation, perform it now.

| IdP           | Session revocation action                                                          |
|---------------|------------------------------------------------------------------------------------|
| **Okta**      | On the member's Okta profile: **More Actions → Clear User Sessions**               |
| **Azure AD**  | In the member's Azure AD profile: **Revoke sessions** (under Authentication methods) |
| **Google WS** | Suspending the user (Step 3c) automatically invalidates existing Google sessions   |

If session revocation is not available or fails, record this in the log template (§6) and note the token TTL so the incident owner can determine when risk expires.

---

### Step 5 — Write the per-account application-log entry

Immediately after Step 4, write a structured log entry using the template in §6. **Do not skip this step.** The log entry is the only audit record that links the TeamBoard offboarding event to the IdP revocation action.

---

### Step 6 — Update the blast-radius tracking table

If executing this runbook as part of a batch remediation:

1. Mark the member's row in the blast-radius output (from `scripts/audit-backfill-query.sql`) as `REVOKED`.
2. Record the `sso_revoked_at` timestamp (UTC) from the log entry you just wrote.
3. Update the TEAM-6 RCA blast-radius table (§6.2 in [TEAM-6-rca.md](../rca/TEAM-6-rca.md)) with the confirmed revocation date.

---

### Step 7 — Repeat for next member

Return to Step 1 for the next affected member. Process one member at a time.

---

## 4. Idempotency Guarantees

This runbook is designed to be safe to re-execute. The following table describes the outcome for each scenario:

| Scenario                                                                                     | Expected outcome                                                                                      |
|----------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| Steps 1–7 run for a member whose SSO was **not yet revoked**                                 | SSO revoked; log entry written; blast-radius table updated. ✅                                         |
| Steps 1–7 run for a member whose SSO was **already revoked** by a previous execution         | IdP returns "already deactivated/suspended/blocked" state; runbook records idempotent finding in log; no error; blast-radius table updated if not already. ✅ |
| Steps 1–7 run for a member whose **TeamBoard record still exists** (Step 1 fails)            | Runbook halts at Step 1; no IdP action taken; escalation raised. ✅                                    |
| Steps 1–7 run with **unknown IdP** (`idp_provider = NULL`)                                   | Runbook halts at Step 2; no IdP action taken; escalation raised. ✅                                    |
| Step 3 partially completes (e.g. operator closes browser after Okta deactivation, before session clear) | Step 4 can be re-run independently; the deactivation in Step 3 is already committed and is idempotent on re-run. ✅ |

**Key idempotency principle:** Every IdP deactivation / suspension / block-sign-in action is a state-set operation (not an increment). Applying it to an account that is already in the target state produces no error and no side effect.

---

## 5. Audit Trail Location

All revocations executed via this runbook must produce at least two audit records:

| Record type                    | Location                                                                                          | Retention |
|--------------------------------|---------------------------------------------------------------------------------------------------|-----------|
| **Structured application log** | TeamBoard application log (Datadog / CloudWatch / equivalent) — see §6 for the required format   | Per your organisation's log retention policy (minimum 90 days recommended) |
| **IdP admin audit log**        | Okta System Log / Azure AD Sign-in & Audit Logs / Google Admin Audit Log — automatically written by the IdP on any account state change | Per IdP's audit log retention (typically 30–90 days) |
| **Incident / Jira ticket**     | Comment on the originating ticket (from §2.2 `ticket_id`) with a summary of members processed, timestamps, and operators | Indefinite (Jira retention) |

> **Important:** The structured application log entry (§6) is the *primary* record within TeamBoard's own audit trail. The IdP admin logs are the secondary, authoritative record for IdP-side changes. Both must be preserved. Neither is a substitute for the other.

---

## 6. Per-Account Application-Log Template

Write this log entry **once per member** immediately after completing Step 4. Use JSON format. Emit it to the same log sink as the TeamBoard application logs (stdout in production, captured by your log aggregator).

This template directly mitigates the **patchwork-state risk** (failure hypothesis S-6): by requiring a single structured record per member that captures *which* IdP was targeted and what the outcome was, partial or inconsistent revocations become detectable.

```json
{
  "level": "info",
  "event": "sso_manual_revocation",
  "timestamp_utc": "<ISO-8601 UTC timestamp — e.g. 2026-06-10T14:32:00Z>",
  "member_id": "<TeamBoard member ID>",
  "account_id": "<TeamBoard account ID>",
  "email": "<member email address>",
  "idp_provider": "<okta | azure_ad | google_workspace>",
  "revocation_action": "<deactivated | sign_in_blocked | suspended>",
  "session_revocation": "<completed | not_supported | failed — with reason if failed>",
  "departure_event_at": "<ISO-8601 UTC — timestamp of DELETE /api/members/:id call>",
  "sso_revoked_at": "<ISO-8601 UTC — timestamp this runbook step completed>",
  "gap_hours": "<numeric — hours between departure_event_at and sso_revoked_at>",
  "operator": "<your name or username>",
  "ticket_id": "<Jira / incident tracker ticket ID>",
  "runbook_version": "RB-SSO-001",
  "idp_already_revoked": "<true | false — true if IdP showed account was already deactivated before this step>",
  "notes": "<free text — any anomalies, partial states, or follow-up actions required>"
}
```

### Example — completed revocation

```json
{
  "level": "info",
  "event": "sso_manual_revocation",
  "timestamp_utc": "2026-06-10T14:32:00Z",
  "member_id": "mbr_0042",
  "account_id": "acc_7731",
  "email": "j.smith@customer.example.com",
  "idp_provider": "okta",
  "revocation_action": "deactivated",
  "session_revocation": "completed",
  "departure_event_at": "2026-05-20T09:15:00Z",
  "sso_revoked_at": "2026-06-10T14:32:00Z",
  "gap_hours": 509,
  "operator": "prakhar.srivastav@appfire.com",
  "ticket_id": "TEAM-6",
  "runbook_version": "RB-SSO-001",
  "idp_already_revoked": false,
  "notes": "Departure event confirmed in TeamBoard access log at 2026-05-20T09:15Z. No prior revocation record found in Okta System Log."
}
```

### Example — idempotent re-execution (account already revoked)

```json
{
  "level": "info",
  "event": "sso_manual_revocation",
  "timestamp_utc": "2026-06-10T15:00:00Z",
  "member_id": "mbr_0042",
  "account_id": "acc_7731",
  "email": "j.smith@customer.example.com",
  "idp_provider": "okta",
  "revocation_action": "deactivated",
  "session_revocation": "not_supported",
  "departure_event_at": "2026-05-20T09:15:00Z",
  "sso_revoked_at": "2026-06-10T14:32:00Z",
  "gap_hours": 509,
  "operator": "prakhar.srivastav@appfire.com",
  "ticket_id": "TEAM-6",
  "runbook_version": "RB-SSO-001",
  "idp_already_revoked": true,
  "notes": "Re-executed as verification pass. Okta showed status Deactivated prior to any action. No further action required."
}
```

---

## 7. Rollback Steps

SSO deprovisioning is intentionally a **one-way safety action**: revoking a departed employee's access is the correct end state and should not be rolled back. However, if a revocation was performed on the **wrong account** (operator error), the following steps apply.

> ⚠️ **Rollback is only appropriate for erroneous revocations.** If there is any doubt about whether the departure was legitimate, escalate to the security team (§8) before re-enabling access.

### 7.1 Rollback procedure

| Step | Action                                                                                                        |
|------|---------------------------------------------------------------------------------------------------------------|
| 1    | **Stop** — confirm with the incident owner and security team that rollback is authorised.                     |
| 2    | **Identify the incorrect revocation** from the log entry written in §6 (use `member_id` and `idp_provider`). |
| 3    | **Re-enable the account** in the IdP using the appropriate action below.                                      |
| 4    | **Write a rollback log entry** using the §6 template with `event: "sso_manual_revocation_rollback"` and `notes` explaining the reason. |
| 5    | **Update the incident ticket** with the rollback action, operator, and authorising approver.                  |

### 7.2 Re-enable actions per IdP

| IdP           | Re-enable action                                                                                         |
|---------------|----------------------------------------------------------------------------------------------------------|
| **Okta**      | Admin Console → People → *member* → **More Actions → Activate** (or **Unsuspend** if suspended rather than deactivated) |
| **Azure AD**  | Portal → Azure AD → Users → *member* → Settings → **Block sign-in: No** → Save                          |
| **Google WS** | Admin Console → Users → *member* → **More options (⋮) → Restore user**                                  |

### 7.3 After rollback

1. Notify the security team that the account has been re-enabled; they must monitor for any suspicious sign-in activity.
2. Investigate how the incorrect member was selected (blast-radius SQL result? manual lookup error?) and document a corrective action in the incident ticket.

---

## 8. Escalation Path

Escalate immediately in any of the following situations. **Do not attempt to continue the runbook** until the escalation is resolved.

| Situation                                                                                     | Escalation target                              | Action                                                               |
|-----------------------------------------------------------------------------------------------|------------------------------------------------|----------------------------------------------------------------------|
| TeamBoard member record still exists (Step 1 check fails)                                     | Engineering on-call                            | Open a P1 incident; do not revoke SSO until offboarding is confirmed |
| `idp_provider` is `NULL` or `UNKNOWN` and cannot be determined from account config            | Account's CSM or Support lead                  | Contact the customer to confirm their IdP before proceeding          |
| IdP admin console is inaccessible or credentials are invalid                                  | IT / SRE on-call                               | Open an access incident; do not delay SSO revocation — request emergency access |
| IdP API returns an unexpected error during revocation that cannot be resolved within 15 minutes| Engineering on-call + Security team            | Escalate immediately; document the error in the incident ticket      |
| Affected member appears to have accessed systems **after** the departure date (active breach) | Security team (immediate) + Engineering on-call| Treat as an active security incident; revocation is still required but security team must lead |
| Rollback is requested for any reason                                                          | Security team + Incident owner                 | Rollback requires explicit sign-off from both (see §7)               |
| More than 10 members require revocation in a single batch                                     | Engineering team                               | Consider automating via `scripts/sso-revoke.ts` before executing manually; batches > 10 are high-risk for operator error |

### Contact list

| Role                     | Contact / Channel                  |
|--------------------------|------------------------------------|
| Engineering on-call      | `[TBC — add PagerDuty / on-call rotation link]` |
| Security team            | `[TBC — add security@ alias or Slack channel]` |
| IT / SRE on-call         | `[TBC — add IT helpdesk or SRE rotation]`      |
| Investigation lead       | prakhar.srivastav@appfire.com      |

---

## 9. Post-Execution Checklist

After completing the runbook for all members in a batch, verify the following before closing the incident or task:

- [ ] Every processed member has a corresponding structured log entry in the application log (§6).
- [ ] Every log entry has been confirmed present in the log aggregator (search by `event: "sso_manual_revocation"` and `ticket_id`).
- [ ] All blast-radius SQL output rows have been updated with confirmed `sso_revoked_at` timestamps.
- [ ] The TEAM-6 RCA blast-radius table (§6.2 in [TEAM-6-rca.md](../rca/TEAM-6-rca.md)) reflects the updated status.
- [ ] The originating incident or Jira ticket has been updated with a summary comment listing: members processed, operators, timestamps, and any anomalies.
- [ ] Any members whose IdP was `UNKNOWN` at the start have been resolved and either processed or escalated.
- [ ] If any session revocations failed (Step 4), the token TTL has been noted and a follow-up reminder has been set for after TTL expiry to confirm sessions are no longer active.
- [ ] If this was a batch of > 10 members, a note has been added to TEAM-9 requesting that the automated hook be prioritised.

---

*Last updated: 2026-06-10 · Owner: prakhar.srivastav@appfire.com · Runbook ID: RB-SSO-001*
