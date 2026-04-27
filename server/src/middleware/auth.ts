import { Request } from 'express';
import { OktaOIDC } from '@okta/oidc-middleware';

export const oidc = new OktaOIDC({
  issuer: process.env.OKTA_ISSUER!,
  client_id: process.env.OKTA_CLIENT_ID!,
  client_secret: process.env.OKTA_CLIENT_SECRET!,
  appBaseUrl: process.env.APP_BASE_URL!,
  scope: 'openid profile email groups',
});

type UserContext = {
  userinfo?: {
    email?: string;
    groups?: string[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

function getUserContext(req: Request): UserContext | undefined {
  return (req as Request & { userContext?: UserContext }).userContext;
}

export function extractWorkspaceSlugs(req: Request): string[] {
  const userContext = getUserContext(req);
  const groups = userContext?.userinfo?.groups;
  if (!groups || !Array.isArray(groups)) return [];
  return groups
    .filter((g) => g.startsWith('tb-workspace-'))
    .map((g) => g.slice('tb-workspace-'.length));
}

export function setActorEmail(req: Request): void {
  const userContext = getUserContext(req);
  req.actorEmail = userContext?.userinfo?.email ?? '';
}
