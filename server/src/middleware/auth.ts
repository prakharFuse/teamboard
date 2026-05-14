import OktaJwtVerifier from '@okta/jwt-verifier';
import type { Request, Response, NextFunction } from 'express';
import type { OktaClaims } from '../types/express.js';

const jwtVerifier = new OktaJwtVerifier({
  issuer: `${process.env.OKTA_DOMAIN}/oauth2/${process.env.OKTA_AUTH_SERVER_ID}`,
  clientId: process.env.OKTA_CLIENT_ID,
});

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'Missing authorization token' });
    return;
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const jwt = await jwtVerifier.verifyAccessToken(token, process.env.OKTA_AUDIENCE ?? 'api://default');
    req.rawClaims = jwt.claims as unknown as OktaClaims;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
