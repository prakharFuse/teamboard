/*
 * POST /api/auth/signin — Response Shape
 * ─────────────────────────────────────────────────────────────────────────────
 * Request body:
 *   { idToken: string }   — Okta OIDC ID token obtained after SSO login
 *
 * Success response (HTTP 200):
 *   {
 *     success: true,
 *     user: {
 *       id:    string,   // Okta subject claim (sub) — stable user identifier
 *       email: string,   // user's email address
 *       name:  string    // user's display name
 *     },
 *     workspaces: Array<{
 *       id:                      number,  // primary key in workspaces table
 *       slug:                    string,  // short identifier, e.g. "parent", "brightline"
 *       name:                    string,  // human-readable workspace name
 *       bamboohr_dept_code_list: string,  // JSON-encoded dept code list for this workspace
 *       okta_group:              string   // Okta group that grants access, e.g. "tb-workspace-brightline"
 *     }>,
 *     expiresAt: number  // ID-token expiry as Unix epoch seconds (from JWT exp claim)
 *   }
 *
 * Error responses:
 *   HTTP 400  { error: 'Missing idToken' }
 *   HTTP 401  { error: 'Invalid or expired ID token' }
 *   HTTP 500  { error: 'Internal server error' }
 *
 * Compliance note (TEAM-8): this shape has been shared with the Compliance
 * team for SOC 2 review and with the client integration team for the UI
 * workspace-switcher feature. Do not alter field names without updating
 * CLAUDE.md and notifying both teams.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Router, Request, Response } from 'express';
import OktaJwtVerifier from '@okta/jwt-verifier';
import { getDb } from '../db.js';
import type { WorkspaceRow } from '../types.js';

const router: Router = Router();

const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: process.env.OKTA_ISSUER ?? '',
  clientId: process.env.OKTA_CLIENT_ID ?? '',
});

const clientId = process.env.OKTA_CLIENT_ID ?? '';

router.post('/signin', async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body as { idToken?: string };

    if (!idToken) {
      res.status(400).json({ error: 'Missing idToken' });
      return;
    }

    let jwt: Awaited<ReturnType<typeof oktaJwtVerifier.verifyIdToken>>;
    try {
      jwt = await oktaJwtVerifier.verifyIdToken(idToken, clientId);
    } catch {
      res.status(401).json({ error: 'Invalid or expired ID token' });
      return;
    }

    const claims = jwt.claims as {
      sub?: string;
      email?: string;
      name?: string;
      groups?: string[];
      exp?: number;
    };

    const id = claims.sub ?? '';
    const email = claims.email ?? '';
    const name = claims.name ?? '';
    const groups = claims.groups ?? [];
    const expiresAt = claims.exp ?? 0;

    const slugs = groups
      .filter((g) => g.startsWith('tb-workspace-'))
      .map((g) => g.slice('tb-workspace-'.length));

    let workspaces: WorkspaceRow[] = [];

    if (slugs.length > 0) {
      const db = getDb();
      const placeholders = slugs.map(() => '?').join(', ');
      workspaces = db
        .prepare(`SELECT * FROM workspaces WHERE slug IN (${placeholders})`)
        .all(...slugs) as unknown as WorkspaceRow[];
    }

    res.json({
      success: true,
      user: { id, email, name },
      workspaces,
      expiresAt,
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
