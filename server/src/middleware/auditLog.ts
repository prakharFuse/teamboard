import type { Request, Response, NextFunction } from 'express';
import { getDb } from '../db.js';

export function auditLogMiddleware(req: Request, res: Response, next: NextFunction): void {
  next();

  res.on('finish', () => {
    if (!req.workspace) {
      return;
    }

    try {
      getDb()
        .prepare(
          "INSERT INTO audit_log (actor_email, workspace_id, action, entity_id, at) VALUES (?, ?, ?, ?, datetime('now'))"
        )
        .run(
          req.workspace.userEmail,
          req.workspace.id,
          req.method + ' ' + req.path,
          res.locals.entityId ?? req.params.id ?? null
        );
    } catch (err) {
      console.error('[auditLog] Failed to write audit log entry:', err);
    }
  });
}
