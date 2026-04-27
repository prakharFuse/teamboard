import { Request, Response, NextFunction } from 'express';
import { getDb } from '../db.js';
import { extractWorkspaceSlugs, setActorEmail } from './auth.js';

interface WorkspaceRow {
  id: number;
  slug: string;
}

type UserContext = {
  [key: string]: unknown;
};

function getUserContext(req: Request): UserContext | undefined {
  return (req as Request & { userContext?: UserContext }).userContext;
}

function getHeaderSlug(req: Request): string | undefined {
  const value = req.headers['x-workspace-id'];
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export function resolveWorkspace(req: Request, res: Response, next: NextFunction): void {
  const rawHeader = getHeaderSlug(req);
  const headerWasProvided = rawHeader !== undefined;
  const slug = headerWasProvided ? rawHeader! : 'parent-co';

  const db = getDb();
  const row = db
    .prepare('SELECT id, slug FROM workspaces WHERE slug = ?')
    .get(slug) as unknown as WorkspaceRow | undefined;

  if (!row) {
    if (headerWasProvided) {
      res.status(404).json({ error: `Workspace not found: ${slug}` });
      return;
    }
    // 'parent-co' is always seeded; if somehow missing, fall through gracefully
    next();
    return;
  }

  req.workspaceId = row.id;
  req.workspaceSlug = row.slug;

  const userContext = getUserContext(req);
  if (userContext !== undefined) {
    // Authenticated user — derive allowed slugs from Okta groups
    req.allowedWorkspaceSlugs = extractWorkspaceSlugs(req);
  } else if (!headerWasProvided) {
    // Legacy consumer (no header, no auth) — implicitly allowed to read parent-co
    req.allowedWorkspaceSlugs = ['parent-co'];
  } else {
    // Header provided but no auth session — requireWorkspaceAccess will reject with 401
    req.allowedWorkspaceSlugs = [];
  }

  setActorEmail(req);
  next();
}

export function requireWorkspaceAccess(req: Request, res: Response, next: NextFunction): void {
  const headerWasProvided = req.headers['x-workspace-id'] !== undefined;
  const userContext = getUserContext(req);

  // Backward-compat: unauthenticated headerless requests to parent-co pass through
  if (userContext === undefined && req.workspaceSlug === 'parent-co' && !headerWasProvided) {
    next();
    return;
  }

  // Unauthenticated request with an explicit workspace header → require auth
  if (userContext === undefined && headerWasProvided) {
    res.status(401).json({ error: `Authentication required to access workspace: ${req.workspaceSlug}` });
    return;
  }

  // Authenticated (or unauthenticated but somehow reached here) — check slug allowlist
  if (!req.allowedWorkspaceSlugs.includes(req.workspaceSlug)) {
    res.status(403).json({ error: `Access denied to workspace: ${req.workspaceSlug}` });
    return;
  }

  next();
}
