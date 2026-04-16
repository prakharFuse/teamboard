import { Router, Request, Response } from 'express';
import { VALID_DEPARTMENTS } from '../departments.js';

const router = Router();

router.get('/', (req: Request, res: Response): void => {
  res.json({ departments: VALID_DEPARTMENTS });
});

export default router;