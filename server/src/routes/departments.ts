import { Router, Request, Response } from 'express';
import { DEPARTMENTS } from '../departments.js';

const router: Router = Router();

router.get('/', (req: Request, res: Response): void => {
  res.json({ departments: DEPARTMENTS });
});

export default router;
