import { Router, Request, Response } from 'express';

const router: Router = Router();

router.get('/', (req: Request, res: Response): void => {
  res.json({
    featureFlags: {
      workspaceSwitcher: process.env.FEATURE_WORKSPACE_SWITCHER === 'true',
    },
  });
});

export default router;
