import { RequestHandler, Request, Response, NextFunction } from 'express';
import { getDb } from '../db.js';
import type { WorkspaceRow } from '../types.js';

const resolveWorkspace: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const slug =
    (req.headers['x-workspace-id'] as string | undefined) ?? 'parent';

  const db = getDb();

  const workspace = db
    .prepare('SELECT * FROM workspaces WHERE slug = ?')
    .get(slug) as unknown as WorkspaceRow | undefined;

  if (!workspace) {
    res.status(400).json({ error: 'Unknown workspace' });
    return;
  }

  const userWorkspaces = req.user?.workspaces ?? ['parent'];
  if (!userWorkspaces.includes(slug)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  req.workspace = workspace;
  next();
};

export default resolveWorkspace;
