// server/src/routes/departments.ts — expose the BambooHR department list to the client
import { Router, Request, Response } from 'express';
import { DEPT_CODE_TO_NAME } from '../departments.js';

const router: Router = Router();

/**
 * GET /api/departments
 * Returns the canonical list of departments as { code, name } objects.
 * The client uses this to populate the department dropdown.
 */
router.get('/', (_req: Request, res: Response): void => {
  const departments = Object.entries(DEPT_CODE_TO_NAME).map(([code, name]) => ({ code, name }));
  res.json({ departments });
});

export default router;
