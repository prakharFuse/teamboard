import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';
import { extractWorkspaceSlugs } from '../middleware/auth.js';

interface WorkspaceRow {
  id: number;
  slug: string;
  name: string;
}

const router: Router = Router();

router.get('/', (req: Request, res: Response): void => {
  const slugs = extractWorkspaceSlugs(req);

  if (slugs.length === 0) {
    res.json({ user: { email: req.actorEmail }, workspaces: [] });
    return;
  }

  const db = getDb();
  const placeholders = slugs.map(() => '?').join(',');
  const workspaces = db
    .prepare(
      `SELECT id, slug, name FROM workspaces WHERE slug IN (${placeholders}) ORDER BY name ASC`
    )
    .all(...slugs) as unknown as WorkspaceRow[];

  res.json({ user: { email: req.actorEmail }, workspaces });
});

export default router;
