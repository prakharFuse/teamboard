import type { Request, Response, NextFunction } from 'express';
import { getDb } from '../db.js';

interface WorkspaceRow {
  id: number;
  slug: string;
  name: string;
  bamboohr_dept_code_list: string;
  okta_group: string | null;
}

export async function workspaceContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Extract tb-workspace-* groups from Okta claims; treat missing/non-array as []
  const groups: unknown = req.rawClaims?.groups;
  const workspaceGroups: string[] = Array.isArray(groups)
    ? (groups as string[]).filter((g) => g.startsWith('tb-workspace-'))
    : [];

  // Map group names to workspace slugs by stripping the 'tb-workspace-' prefix
  const accessibleWorkspaces: string[] = workspaceGroups.map((g) =>
    g.replace('tb-workspace-', '')
  );

  if (accessibleWorkspaces.length === 0) {
    res.status(403).json({ error: 'No workspace access assigned to this account' });
    return;
  }

  // Resolve target workspace slug in priority order:
  // 1. req.query.workspace
  // 2. req.headers['x-workspace-id']
  // 3. 'parent-co' fallback for backwards-compatibility with legacy consumers
  //    (Looker dashboards, BambooHR exporter) that do not yet send a workspace context.
  //    TODO: Remove this Parent Co fallback. Removal date: deploy date + 90 days (see docs/ROLLOUT.md Step 7)
  const targetSlug: string =
    (typeof req.query.workspace === 'string' ? req.query.workspace : undefined) ??
    (typeof req.headers['x-workspace-id'] === 'string' ? req.headers['x-workspace-id'] : undefined) ??
    'parent-co';

  if (!accessibleWorkspaces.includes(targetSlug)) {
    res.status(403).json({ error: `No access to workspace '${targetSlug}'` });
    return;
  }

  const db = getDb();
  const workspace = db
    .prepare('SELECT * FROM workspaces WHERE slug = ?')
    .get(targetSlug) as unknown as WorkspaceRow | undefined;

  if (!workspace) {
    res.status(403).json({ error: `No access to workspace '${targetSlug}'` });
    return;
  }

  req.workspace = {
    id: workspace.id,
    slug: workspace.slug,
    name: workspace.name,
    bamboohr_dept_code_list: workspace.bamboohr_dept_code_list,
    userEmail: req.rawClaims?.email ?? '',
    accessibleWorkspaces,
  };

  next();
}
