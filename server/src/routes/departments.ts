import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';

interface DepartmentRow {
  id: number;
  name: string;
}

const router: Router = Router();

router.get('/', (req: Request, res: Response): void => {
  const db = getDb();
  const departments = db
    .prepare(
      'SELECT id, name FROM departments WHERE workspace_id = ? ORDER BY name ASC'
    )
    .all(req.workspaceId) as unknown as DepartmentRow[];

  res.json({ departments });
});

export default router;
