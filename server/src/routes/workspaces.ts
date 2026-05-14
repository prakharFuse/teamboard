import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';

interface WorkspaceRow {
  id: number;
  slug: string;
  name: string;
}

const router: Router = Router();

router.get('/', (req: Request, res: Response): void => {
  if (!req.workspace) { res.status(500).json({ error: 'Internal server error' }); return; }
  const slugs: string[] = req.workspace.accessibleWorkspaces;

  const placeholders = slugs.map(() => '?').join(', ');
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, slug, name FROM workspaces WHERE slug IN (${placeholders}) ORDER BY name ASC`
    )
    .all(...slugs) as unknown as WorkspaceRow[];

  res.status(200).json({ workspaces: rows });
});

export default router;
