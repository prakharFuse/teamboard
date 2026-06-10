#!/usr/bin/env node
/**
 * scripts/sso-revoke.ts — Idempotent SSO revocation script skeleton.
 *
 * Usage:
 *   npx ts-node-esm scripts/sso-revoke.ts \
 *     --account-id <id> --idp <okta|azure_ad|google_workspace> \
 *     --reason "TEAM-6 blast-radius remediation" [--dry-run | --commit]
 *
 * Exactly one of --dry-run or --commit must be supplied (double-action guard).
 * Audit output: one JSON line to stdout per execution.
 * See: docs/runbooks/sso-revocation-runbook.md §6, TEAM-9 (permanent hook)
 */

import { parseArgs } from 'node:util';

// ── Types ───────────────────────────────────────────────────────────────────

type IdpProvider       = 'okta' | 'azure_ad' | 'google_workspace';
type RevocationOutcome = 'revoked' | 'already_revoked' | 'dry_run_only' | 'error';

interface AuditRecord {
  level: 'info' | 'error';
  event: 'sso_revoke';
  timestamp_utc: string;
  account_id: string;
  idp_provider: IdpProvider;
  member_email: string | null; // TODO(TEAM-9): resolve from DB via account_id
  outcome: RevocationOutcome;
  dry_run: boolean;
  reason: string;
  error?: string;
}

// ── Argument parsing ────────────────────────────────────────────────────────

const { values: args } = parseArgs({
  options: {
    'account-id': { type: 'string' },
    idp:          { type: 'string' },
    'dry-run':    { type: 'boolean', default: false },
    commit:       { type: 'boolean', default: false },
    reason:       { type: 'string',  default: '' },
  },
  strict: true,
});

const VALID_IDPS: IdpProvider[] = ['okta', 'azure_ad', 'google_workspace'];

function fatal(msg: string): never {
  process.stderr.write(`[sso-revoke] ERROR: ${msg}\n`);
  process.exit(1);
}

function isIdpProvider(value: string): value is IdpProvider {
  return (VALID_IDPS as string[]).includes(value);
}

function validateArgs(): { accountId: string; idp: IdpProvider; isDryRun: boolean; reason: string } {
  if (!args['account-id']) fatal('--account-id is required');
  if (!args.idp)           fatal('--idp is required (okta | azure_ad | google_workspace)');
  if (!isIdpProvider(args.idp)) {
    fatal(`--idp must be one of: ${VALID_IDPS.join(', ')}`);
  }
  // Double-action guard: passing both flags (or neither) is a hard error so
  // every invocation makes operator intent explicit in the audit log.
  if (args['dry-run'] && args.commit) {
    fatal('--dry-run and --commit are mutually exclusive — supply exactly one');
  }
  if (!args['dry-run'] && !args.commit) {
    fatal('Supply exactly one of --dry-run or --commit');
  }
  return {
    accountId: args['account-id'],
    idp:       args.idp,
    isDryRun:  args['dry-run'] ?? false,
    reason:    args.reason ?? '',
  };
}

// ── IdP client stubs — TODO: implement before using --commit ────────────────
// Each function must be idempotent: an already-deactivated account must not
// throw. Return { alreadyRevoked: true } when no action was needed.

async function revokeOkta(_accountId: string): Promise<{ alreadyRevoked: boolean }> {
  // TODO(TEAM-9): POST /api/v1/users/<okta_user_id>/lifecycle/deactivate
  // Okta error E0000001 ("already deactivated") → return { alreadyRevoked: true }
  throw new Error('Okta client not implemented — use --dry-run until TEAM-9 ships');
}

async function revokeAzureAd(_accountId: string): Promise<{ alreadyRevoked: boolean }> {
  // TODO(TEAM-9): PATCH https://graph.microsoft.com/v1.0/users/<user_id>
  //   body: { "accountEnabled": false }
  //   accountEnabled already false → return { alreadyRevoked: true }
  throw new Error('Azure AD client not implemented — use --dry-run until TEAM-9 ships');
}

async function revokeGoogleWorkspace(_accountId: string): Promise<{ alreadyRevoked: boolean }> {
  // TODO(TEAM-9): PATCH https://admin.googleapis.com/admin/directory/v1/users/<user_key>
  //   body: { "suspended": true }
  //   already suspended → return { alreadyRevoked: true }
  throw new Error('Google Workspace client not implemented — use --dry-run until TEAM-9 ships');
}

const IDP_REVOKE: Record<IdpProvider, (id: string) => Promise<{ alreadyRevoked: boolean }>> = {
  okta:             revokeOkta,
  azure_ad:         revokeAzureAd,
  google_workspace: revokeGoogleWorkspace,
};

// ── Audit emission ──────────────────────────────────────────────────────────

function emitAudit(record: AuditRecord): void {
  // Single JSON line per execution — parseable by Datadog/CloudWatch/any aggregator.
  process.stdout.write(JSON.stringify(record) + '\n');
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const { accountId, idp, isDryRun, reason } = validateArgs();

  const baseRecord = {
    event:         'sso_revoke' as const,
    timestamp_utc: new Date().toISOString(),
    account_id:    accountId,
    idp_provider:  idp,
    member_email:  null,  // TODO(TEAM-9): look up from DB via account_id
    reason,
  };

  if (isDryRun) {
    emitAudit({ level: 'info', ...baseRecord, outcome: 'dry_run_only', dry_run: true });
    return;
  }

  // --commit: execute the real IdP revocation.
  try {
    const { alreadyRevoked } = await IDP_REVOKE[idp](accountId);
    emitAudit({
      level: 'info', ...baseRecord, dry_run: false,
      outcome: alreadyRevoked ? 'already_revoked' : 'revoked',
    });
  } catch (err: unknown) {
    emitAudit({
      level: 'error', ...baseRecord, dry_run: false, outcome: 'error',
      error: err instanceof Error ? err.message : String(err),
    });
    process.exit(1);
  }
}

main();
