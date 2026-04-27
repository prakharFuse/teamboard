import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import session from 'express-session';
import { createRequire } from 'module';
import membersRouter from './routes/members.js';
import workspacesRouter from './routes/workspaces.js';
import authRouter from './routes/auth.js';
import { resolveWorkspace } from './middleware/workspace.js';
import { getDb } from './db.js';

const _require = createRequire(import.meta.url);

const app = express();
const PORT = process.env.PORT || 4060;

// Session middleware — must be registered before OIDC middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET ?? 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
  })
);

// CORS — allowedHeaders must include X-Workspace-Id for workspace routing
app.use(
  cors({
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Workspace-Id'],
  })
);

app.use(express.json());

// Auth: Okta OIDC when enabled, otherwise grant access to all workspaces (dev mode)
if (process.env.OKTA_AUTH_ENABLED === 'true') {
  const { ExpressOIDC } = _require('@okta/oidc-middleware') as {
    ExpressOIDC: new (opts: Record<string, unknown>) => { router: express.Router };
  };

  const oktaAuth = new ExpressOIDC({
    issuer: process.env.OKTA_ISSUER,
    clientId: process.env.OKTA_CLIENT_ID,
    clientSecret: process.env.OKTA_CLIENT_SECRET,
    redirectUri: process.env.OKTA_REDIRECT_URI,
    appBaseUrl: process.env.APP_BASE_URL,
    scope: ['openid', 'profile', 'email', 'groups'],
  });

  app.use(oktaAuth.router);

  // Extract workspace slugs from Okta groups embedded in the ID token claims
  const extractWorkspaceGroups = (req: Request, _res: Response, next: NextFunction): void => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userContext = (req as any).userContext as {
      userinfo?: { email?: string };
      tokens?: { idToken?: { claims?: { groups?: string[] } } };
    } | undefined;

    const groups: string[] = userContext?.tokens?.idToken?.claims?.groups ?? [];

    if (userContext?.userinfo?.email) {
      req.user = { email: userContext.userinfo.email };
    }

    req.userWorkspaces = groups
      .filter((g) => g.startsWith('tb-workspace-'))
      .map((g) => g.slice('tb-workspace-'.length));

    next();
  };

  app.use(extractWorkspaceGroups);
} else {
  // Passthrough: populate req.userWorkspaces with all workspace slugs from the DB
  app.use((req: Request, _res: Response, next: NextFunction): void => {
    const db = getDb();
    const rows = db.prepare('SELECT slug FROM workspaces').all() as unknown as { slug: string }[];
    req.userWorkspaces = rows.map((r) => r.slug);
    next();
  });
}

// Resolve workspace from X-Workspace-Id header (falls back to parent-co when compat flag is set)
app.use(resolveWorkspace);

app.use('/api/members', membersRouter);
app.use('/api/workspaces', workspacesRouter);
app.use('/api/user', authRouter);

app.listen(PORT, () => {
  console.log(`TeamBoard API running on http://localhost:${PORT}`);
});
