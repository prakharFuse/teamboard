#!/usr/bin/env tsx
/**
 * scripts/sso-revoke.ts — idempotent SSO revocation helper
 *
 * TEAM-6 RCA deliverable. See docs/runbooks/sso-revocation-runbook.md for
 * full operational context, rollback steps, and per-account tracking sheet.
 *
 * Usage (--dry-run is the default when neither flag is supplied):
 *
 *   npx tsx scripts/sso-revoke.ts \
 *     --member-id <id> \
 *     --idp-provider <okta|azure|google>
 *
 *   npx tsx scripts/sso-revoke.ts \
 *     --member-id <id> \
 *     --idp-provider <okta|azure|google> \
 *     --apply
 *
 *   npx tsx scripts/sso-revoke.ts \
 *     --member-id <id> \
 *     --idp-provider <okta|azure|google> \
 *     --force-departed --apply
 *
 * Flags:
 *   --member-id <id>      TeamBoard member ID (required)
 *   --idp-provider <p>    One of: okta | azure | google (required)
 *   --dry-run             Simulate only — default; no IdP call, no cache write
 *   --apply               Invoke the IdP revocation stub and write cache entry
 *   --force-departed      Bypass the active-status guard (use with --apply when
 *                         departure is confirmed out-of-band; document in tracking sheet)
 *
 * Output: one JSON object written to stdout per invocation (JSONL-friendly).
 *
 * Exit codes:
 *   0  Success (revoked, no_op, or would_revoke in dry-run)
 *   1  Fatal error (bad args, member not found, state guard, IdP stub error)
 *
 * Idempotency:
 *   A successful --apply run writes a marker to data/sso-revoke-cache.json.
 *   Subsequent runs with the same --member-id + --idp-provider emit action=no_op
 *   and exit 0 without making any IdP call.
 */

import fs from 'node:fs';
import path from 'node:path';
import { getDb } from '../server/src/db.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type IdpProvider = 'okta' | 'azure' | 'google';

interface MemberRow {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  start_date: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

interface IdpResult {
  status: 'ok' | 'not_implemented';
  message: string;
  http_status?: number;
}

interface CacheEntry {
  revoked_at: string;
  member_email: string;
  idp_provider: IdpProvider;
}

type RevocationCache = Record<string, CacheEntry>;

type AuditAction = 'would_revoke' | 'revoked' | 'no_op' | 'error';

interface AuditLine {
  ts: string;
  script: 'sso-revoke';
  member_id: number;
  member_name: string;
  member_email: string;
  member_is_active: number;
  idp_provider: IdpProvider;
  dry_run: boolean;
  force_departed: boolean;
  action: AuditAction;
  cache_key: string;
  idp_response?: IdpResult | null;
  error?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CACHE_PATH = path.join(process.cwd(), 'data', 'sso-revoke-cache.json');
const VALID_PROVIDERS: IdpProvider[] = ['okta', 'azure', 'google'];

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

interface ParsedArgs {
  memberId: number;
  idpProvider: IdpProvider;
  dryRun: boolean;
  forceDeparted: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);
  let memberId: number | undefined;
  let idpProvider: IdpProvider | undefined;
  let apply = false;
  let dryRun = false;
  let forceDeparted = false;

  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    switch (flag) {
      case '--member-id': {
        const raw = args[++i];
        const parsed = parseInt(raw, 10);
        if (isNaN(parsed) || parsed <= 0) fatal('--member-id must be a positive integer');
        memberId = parsed;
        break;
      }
      case '--idp-provider': {
        const raw = args[++i];
        if (!VALID_PROVIDERS.includes(raw as IdpProvider)) {
          fatal(`--idp-provider must be one of: ${VALID_PROVIDERS.join(', ')}`);
        }
        idpProvider = raw as IdpProvider;
        break;
      }
      case '--apply':
        apply = true;
        break;
      case '--dry-run':
        dryRun = true;
        break;
      case '--force-departed':
        forceDeparted = true;
        break;
      default:
        fatal(`Unknown flag: ${flag}`);
    }
  }

  if (memberId === undefined) fatal('--member-id is required');
  if (idpProvider === undefined) fatal('--idp-provider is required');

  // --dry-run is the default; --apply takes precedence when both are supplied
  if (!apply) dryRun = true;

  return {
    memberId: memberId as number,
    idpProvider: idpProvider as IdpProvider,
    dryRun,
    forceDeparted,
  };
}

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

function loadCache(): RevocationCache {
  try {
    if (!fs.existsSync(CACHE_PATH)) return {};
    const raw = fs.readFileSync(CACHE_PATH, 'utf8');
    return JSON.parse(raw) as RevocationCache;
  } catch {
    // Corrupted cache — start fresh; the file will be rewritten on next apply
    return {};
  }
}

function writeCache(cache: RevocationCache): void {
  fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + '\n', 'utf8');
}

function makeCacheKey(memberId: number, provider: IdpProvider): string {
  return `${memberId}:${provider}`;
}

// ---------------------------------------------------------------------------
// IdP stubs — NOT_IMPLEMENTED placeholders
//
// Each function is async to match the shape of the eventual real HTTP call.
// The NOT_IMPLEMENTED error is intentional: before wiring up credentials and
// real endpoints, escalate to L3 Engineering (see runbook §6).
// ---------------------------------------------------------------------------

async function revokeOkta(member: MemberRow): Promise<IdpResult> {
  // TODO(TEAM-6): POST /api/v1/users/{userId}/lifecycle/deactivate
  // Required env vars: OKTA_BASE_URL, OKTA_SSWS_TOKEN (SSWS token or OAuth 2.0
  // client credentials with okta.users.manage scope).
  throw new Error(
    `NOT_IMPLEMENTED: Okta revocation for member ${member.id} (${member.email}). ` +
    'Set OKTA_BASE_URL + OKTA_SSWS_TOKEN and implement this stub before applying.',
  );
}

async function revokeAzure(member: MemberRow): Promise<IdpResult> {
  // TODO(TEAM-6): PATCH /v1.0/users/{userId} body: {"accountEnabled": false}
  // Required env vars: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET
  // (app registration with User.ReadWrite.All permission).
  throw new Error(
    `NOT_IMPLEMENTED: Azure AD revocation for member ${member.id} (${member.email}). ` +
    'Set AZURE_TENANT_ID + AZURE_CLIENT_ID + AZURE_CLIENT_SECRET and implement this stub.',
  );
}

async function revokeGoogle(member: MemberRow): Promise<IdpResult> {
  // TODO(TEAM-6): PUT /admin/directory/v1/users/{userKey} body: {"suspended": true}
  // Required env vars: GOOGLE_SERVICE_ACCOUNT_JSON (domain-wide delegation key
  // with https://www.googleapis.com/auth/admin.directory.user scope).
  throw new Error(
    `NOT_IMPLEMENTED: Google Workspace revocation for member ${member.id} (${member.email}). ` +
    'Set GOOGLE_SERVICE_ACCOUNT_JSON and implement this stub before applying.',
  );
}

async function callIdp(provider: IdpProvider, member: MemberRow): Promise<IdpResult> {
  switch (provider) {
    case 'okta':   return revokeOkta(member);
    case 'azure':  return revokeAzure(member);
    case 'google': return revokeGoogle(member);
  }
}

// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------

function emit(line: AuditLine): void {
  process.stdout.write(JSON.stringify(line) + '\n');
}

function fatal(msg: string): never {
  process.stderr.write(`[sso-revoke] FATAL: ${msg}\n`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const { memberId, idpProvider, dryRun, forceDeparted } = parseArgs(process.argv);

  // Load member from DB
  const db = getDb();
  const member = db
    .prepare('SELECT * FROM members WHERE id = ?')
    .get(memberId) as MemberRow | undefined;

  if (!member) {
    fatal(`Member not found: id=${memberId}`);
  }

  const key = makeCacheKey(memberId, idpProvider);
  const cache = loadCache();
  const now = new Date().toISOString();

  // --- Idempotency check — second run is a no-op ---
  if (cache[key]) {
    emit({
      ts: now,
      script: 'sso-revoke',
      member_id: member.id,
      member_name: member.name,
      member_email: member.email,
      member_is_active: member.is_active,
      idp_provider: idpProvider,
      dry_run: dryRun,
      force_departed: forceDeparted,
      action: 'no_op',
      cache_key: key,
      idp_response: null,
    });
    process.exit(0);
  }

  // --- State-machine guard: refuse to revoke still-active members ---
  // is_active=1 means the member has not been marked as departed in TeamBoard.
  // Use --force-departed when you have out-of-band confirmation of departure
  // (HR email, BambooHR record) but the DB has not been updated yet.
  if (!forceDeparted && member.is_active !== 0) {
    const errMsg =
      `Member id=${member.id} (${member.email}) is still active (is_active=${member.is_active}). ` +
      'The lifecycle state machine has not recorded a departure transition. ' +
      'Pass --force-departed to override (document justification in the tracking sheet).';
    emit({
      ts: now,
      script: 'sso-revoke',
      member_id: member.id,
      member_name: member.name,
      member_email: member.email,
      member_is_active: member.is_active,
      idp_provider: idpProvider,
      dry_run: dryRun,
      force_departed: forceDeparted,
      action: 'error',
      cache_key: key,
      error: errMsg,
    });
    process.exit(1);
  }

  // --- Dry-run path (default when --apply is not passed) ---
  if (dryRun) {
    emit({
      ts: now,
      script: 'sso-revoke',
      member_id: member.id,
      member_name: member.name,
      member_email: member.email,
      member_is_active: member.is_active,
      idp_provider: idpProvider,
      dry_run: true,
      force_departed: forceDeparted,
      action: 'would_revoke',
      cache_key: key,
      idp_response: null,
    });
    process.exit(0);
  }

  // --- Apply path: invoke IdP stub ---
  let idpResult: IdpResult;
  try {
    idpResult = await callIdp(idpProvider, member);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    emit({
      ts: now,
      script: 'sso-revoke',
      member_id: member.id,
      member_name: member.name,
      member_email: member.email,
      member_is_active: member.is_active,
      idp_provider: idpProvider,
      dry_run: false,
      force_departed: forceDeparted,
      action: 'error',
      cache_key: key,
      error: errMsg,
    });
    process.exit(1);
  }

  // Write idempotency marker — subsequent runs will short-circuit to no_op
  cache[key] = {
    revoked_at: now,
    member_email: member.email,
    idp_provider: idpProvider,
  };
  writeCache(cache);

  emit({
    ts: now,
    script: 'sso-revoke',
    member_id: member.id,
    member_name: member.name,
    member_email: member.email,
    member_is_active: member.is_active,
    idp_provider: idpProvider,
    dry_run: false,
    force_departed: forceDeparted,
    action: 'revoked',
    cache_key: key,
    idp_response: idpResult,
  });

  process.exit(0);
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  process.stderr.write(`[sso-revoke] Unhandled error: ${msg}\n`);
  process.exit(1);
});
