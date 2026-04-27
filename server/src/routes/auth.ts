import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';

interface AccessibleWorkspace {
  slug: string;
  name: string;
}

const router: Router = Router();

router.get('/', (req: Request, res: Response): void => {
  const email = req.user?.email ?? null;
  const workspaceSwitcherEnabled = process.env.WORKSPACE_SWITCHER_ENABLED === 'true';

  if (req.userWorkspaces.length === 0) {
    res.json({ email, accessible_workspaces: [], workspace_switcher_enabled: workspaceSwitcherEnabled });
    return;
  }

  const db = getDb();
  const placeholders = Array(req.userWorkspaces.length).fill('?').join(',');
  const rows = db.prepare(
    `SELECT slug, name FROM workspaces WHERE slug IN (${placeholders})`
  ).all(...req.userWorkspaces) as unknown as AccessibleWorkspace[];

  res.json({
    email,
    accessible_workspaces: rows,
    workspace_switcher_enabled: workspaceSwitcherEnabled,
  });
});

export default router;
