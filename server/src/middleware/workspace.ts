import { Request, Response, NextFunction } from 'express';
import { getDb } from '../db.js';

export interface WorkspaceRow {
  id: number;
  slug: string;
  name: string;
  bamboohr_dept_code_list: string | null;
  bamboohr_api_key: string | null;
  okta_group: string | null;
}

export function resolveWorkspace(req: Request, res: Response, next: NextFunction): void {
  const db = getDb();
  const slug = req.headers['x-workspace-id'] as string | undefined;

  let workspace: WorkspaceRow | undefined;

  if (slug) {
    workspace = db.prepare('SELECT * FROM workspaces WHERE slug = ?').get(slug) as WorkspaceRow | undefined;
  }

  if (!workspace && process.env.WORKSPACE_COMPAT_FALLBACK !== 'false') {
    workspace = db.prepare('SELECT * FROM workspaces WHERE slug = ?').get('parent-co') as WorkspaceRow | undefined;
  }

  if (!workspace) {
    res.status(404).json({ error: 'Workspace not found' });
    return;
  }

  req.workspace = workspace;
  next();
}

export function requireWorkspaceAccess(req: Request, res: Response, next: NextFunction): void {
  if (process.env.OKTA_AUTH_ENABLED !== 'true') {
    next();
    return;
  }

  const slug = req.workspace.slug;
  if (!req.userWorkspaces.includes(slug)) {
    res.status(403).json({ error: 'Forbidden', workspace: slug });
    return;
  }

  next();
}
