import { Router, Request, Response } from 'express';
import { DEPARTMENT_MAP } from '../departments.js';

const router: Router = Router();

router.get('/', (req: Request, res: Response): void => {
  res.json({ departments: DEPARTMENT_MAP });
});

export default router;
