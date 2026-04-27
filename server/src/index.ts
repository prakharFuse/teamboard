import express, { Request, Response } from 'express';
import cors from 'cors';
import session from 'express-session';
import { oidc } from './middleware/auth.js';
import { resolveWorkspace, requireWorkspaceAccess } from './middleware/workspace.js';
import membersRouter from './routes/members.js';
import workspacesRouter from './routes/workspaces.js';
import departmentsRouter from './routes/departments.js';

const app = express();
const PORT = process.env.PORT || 4060;

app.use(cors());
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET ?? 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  })
);

app.use(oidc.router);

app.get('/api/config', (_req: Request, res: Response): void => {
  res.json({
    featureFlags: {
      workspaceSwitcher: process.env.FEATURE_WORKSPACE_SWITCHER === '1',
    },
  });
});

app.use(
  '/api/members',
  resolveWorkspace,
  requireWorkspaceAccess,
  membersRouter
);

app.use(
  '/api/workspaces',
  oidc.ensureAuthenticated(),
  workspacesRouter
);

app.use(
  '/api/departments',
  resolveWorkspace,
  departmentsRouter
);

app.listen(PORT, () => {
  console.log(`TeamBoard API running on http://localhost:${PORT}`);
});
