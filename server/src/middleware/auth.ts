import OktaJwtVerifier from '@okta/jwt-verifier';
import { RequestHandler, Request, Response, NextFunction } from 'express';

const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: process.env.OKTA_ISSUER ?? '',
  clientId: process.env.OKTA_CLIENT_ID ?? '',
});

const requireAuth: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      // Backward-compat path: no token present — treat as anonymous Parent Co user
      // so existing Looker dashboards and BambooHR exporters continue to work.
      req.user = { email: 'anonymous', workspaces: ['parent'] };
      next();
      return;
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : '';

    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    let jwt: Awaited<ReturnType<typeof oktaJwtVerifier.verifyAccessToken>>;
    try {
      const audience = process.env.OKTA_AUDIENCE ?? 'api://default';
      jwt = await oktaJwtVerifier.verifyAccessToken(token, audience);
    } catch {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const claims = jwt.claims as { email?: string; groups?: string[] };
    const email = claims.email ?? '';
    const groups = claims.groups ?? [];

    const workspaces = groups
      .filter((g) => g.startsWith('tb-workspace-'))
      .map((g) => g.slice('tb-workspace-'.length));

    req.user = { email, workspaces };
    next();
  } catch (err) {
    next(err);
  }
};

export default requireAuth;
