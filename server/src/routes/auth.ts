import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';

interface WorkspaceRow {
  id: number;
  slug: string;
  name: string;
}

interface OktaTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface JwtPayload {
  groups?: string[];
  [key: string]: unknown;
}

const router: Router = Router();

router.post('/callback', async (req: Request, res: Response): Promise<void> => {
  const { code, redirectUri } = req.body as { code?: string; redirectUri?: string };

  if (!code || !redirectUri) {
    res.status(400).json({ error: 'Missing required fields: code, redirectUri' });
    return;
  }

  const oktaDomain = process.env.OKTA_DOMAIN ?? '';
  const authServerId = process.env.OKTA_AUTH_SERVER_ID ?? '';
  const clientId = process.env.OKTA_CLIENT_ID ?? '';
  const clientSecret = process.env.OKTA_CLIENT_SECRET ?? '';

  const tokenEndpoint = `${oktaDomain}/oauth2/${authServerId}/v1/token`;

  let tokenResponse: OktaTokenResponse;
  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    tokenResponse = (await response.json()) as OktaTokenResponse;
  } catch (err) {
    res.status(502).json({ error: 'Failed to reach Okta token endpoint' });
    return;
  }

  const accessToken = tokenResponse.access_token;
  if (!accessToken) {
    res.status(502).json({ error: 'No access_token returned from Okta' });
    return;
  }

  // Decode JWT payload (the middle segment) — no signature verification needed
  // here because the token will be verified on every subsequent API call via
  // authMiddleware using the JWKS endpoint.
  let groups: string[] = [];
  try {
    const segments = accessToken.split('.');
    if (segments.length !== 3) {
      throw new Error('Invalid JWT structure');
    }
    // Base64url → Base64 → decode
    const payloadBase64 = segments[1].replace(/-/g, '+').replace(/_/g, '/');
    const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf-8');
    const payload = JSON.parse(payloadJson) as JwtPayload;
    groups = Array.isArray(payload.groups) ? (payload.groups as string[]) : [];
  } catch {
    // Malformed token — treat groups as empty; 403 will follow below.
  }

  // Extract workspace slugs from tb-workspace-* groups.
  const slugs = groups
    .filter((g) => g.startsWith('tb-workspace-'))
    .map((g) => g.slice('tb-workspace-'.length));

  if (slugs.length === 0) {
    res.status(403).json({ error: 'No workspace access assigned' });
    return;
  }

  // Fetch the matching workspace rows in a single parameterised query.
  const db = getDb();
  const placeholders = slugs.map(() => '?').join(', ');
  const workspaces = db
    .prepare(`SELECT id, slug, name FROM workspaces WHERE slug IN (${placeholders}) ORDER BY name ASC`)
    .all(...slugs) as unknown as WorkspaceRow[];

  res.status(200).json({ token: accessToken, workspaces });
});

export default router;
