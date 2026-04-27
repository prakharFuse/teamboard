import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';

interface WorkspacePublicRow {
  id: number;
  slug: string;
  name: string;
}

const router: Router = Router();

router.get('/', (req: Request, res: Response): void => {
  if (req.userWorkspaces.length === 0) {
    res.json({ workspaces: [] });
    return;
  }

  const db = getDb();
  const placeholders = Array(req.userWorkspaces.length).fill('?').join(',');
  const rows = db.prepare(
    `SELECT id, slug, name FROM workspaces WHERE slug IN (${placeholders})`
  ).all(...req.userWorkspaces) as unknown as WorkspacePublicRow[];

  res.json({ workspaces: rows });
});

export default router;
