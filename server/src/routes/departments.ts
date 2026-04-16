import { Router, Request, Response } from 'express';
import { DEPARTMENTS } from '../departments.js';

const router: Router = Router();

router.get('/', (req: Request, res: Response): void => {
  const departments = Object.entries(DEPARTMENTS).map(([code, name]) => ({ code, name }));
  res.json({ departments });
});

export default router;
