import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';
import type { StatementResultingChanges } from 'node:sqlite';

interface MemberRow {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  start_date: string;
  is_active: number;
  workspace_id: number;
  created_at: string;
  updated_at: string;
}

// Local type for workspaces-table query results used in the export handler.
interface WorkspaceRow {
  id: number;
  slug: string;
  name: string;
  bamboohr_dept_code_list: string;
  okta_group: string | null;
}

const router: Router = Router();

router.get('/', (req: Request, res: Response): void => {
  if (!req.workspace) { res.status(500).json({ error: 'Internal server error' }); return; }
  const db = getDb();
  const rows = db.prepare(
    'SELECT * FROM members WHERE is_active = 1 AND workspace_id = ? ORDER BY name ASC'
  ).all(req.workspace.id) as unknown as MemberRow[];
  res.json({ members: rows });
});

router.post('/', (req: Request, res: Response): void => {
  if (!req.workspace) { res.status(500).json({ error: 'Internal server error' }); return; }
  const { name, email, role, department, start_date } = req.body;
  if (!name || !email || !role || !department || !start_date) {
    res.status(400).json({ error: 'Missing required fields: name, email, role, department, start_date' });
    return;
  }

  // Validate department against workspace's allowed dept code list (TM-103).
  const allowedDepts: string[] = JSON.parse(req.workspace.bamboohr_dept_code_list);
  if (allowedDepts.length > 0 && !allowedDepts.includes(department)) {
    res.status(400).json({ error: `Invalid department. Must be one of: ${allowedDepts.join(', ')}` });
    return;
  }

  const db = getDb();
  try {
    const result: StatementResultingChanges = db.prepare(
      'INSERT INTO members (name, email, role, department, start_date, workspace_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(name, email, role, department, start_date, req.workspace.id);
    res.locals.entityId = Number(result.lastInsertRowid);
    const member = db.prepare(
      'SELECT * FROM members WHERE id = ?'
    ).get(res.locals.entityId) as unknown as MemberRow;
    res.status(201).json(member);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('UNIQUE')) {
      res.status(409).json({ error: 'A member with this email already exists' });
      return;
    }
    throw err;
  }
});

router.get('/export', (req: Request, res: Response): void => {
  if (!req.workspace) { res.status(500).json({ error: 'Internal server error' }); return; }
  const db = getDb();
  // Scope export to the current workspace (resolved by workspaceContextMiddleware).
  const rows = db.prepare(
    'SELECT * FROM members WHERE workspace_id = ? ORDER BY name ASC'
  ).all(req.workspace.id) as unknown as MemberRow[];
  // TM-101: enforce stable column order id,name,email,role,department,start_date,is_active.
  const header = 'id,name,email,role,department,start_date,is_active';
  const csv = [header, ...rows.map(r =>
    `${r.id},${r.name},${r.email},${r.role},${r.department},${r.start_date},${r.is_active}`
  )].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${req.workspace.slug}-members.csv"`);
  res.send(csv);
});

router.get('/stats', (req: Request, res: Response): void => {
  if (!req.workspace) { res.status(500).json({ error: 'Internal server error' }); return; }
  const db = getDb();
  const total = db.prepare(
    'SELECT COUNT(*) as count FROM members WHERE is_active = 1 AND workspace_id = ?'
  ).get(req.workspace.id) as unknown as { count: number };
  const byDept = db.prepare(
    'SELECT department, COUNT(*) as count FROM members WHERE is_active = 1 AND workspace_id = ? GROUP BY department ORDER BY count DESC'
  ).all(req.workspace.id) as unknown as { department: string; count: number }[];
  res.json({ total: total.count, byDepartment: byDept });
});

router.get('/:id', (req: Request, res: Response): void => {
  if (!req.workspace) { res.status(500).json({ error: 'Internal server error' }); return; }
  const db = getDb();
  const member = db.prepare(
    'SELECT * FROM members WHERE id = ? AND workspace_id = ?'
  ).get(Number(req.params.id), req.workspace.id) as unknown as MemberRow | undefined;
  if (!member) {
    res.status(404).json({ error: 'Member not found' });
    return;
  }
  res.json(member);
});

router.patch('/:id', (req: Request, res: Response): void => {
  if (!req.workspace) { res.status(500).json({ error: 'Internal server error' }); return; }
  const db = getDb();
  const member = db.prepare(
    'SELECT * FROM members WHERE id = ? AND workspace_id = ?'
  ).get(Number(req.params.id), req.workspace.id) as unknown as MemberRow | undefined;
  if (!member) {
    res.status(404).json({ error: 'Member not found' });
    return;
  }
  const { name, email, role, department } = req.body;

  // Validate department against workspace's allowed dept code list (TM-103).
  if (department !== undefined) {
    const allowedDepts: string[] = JSON.parse(req.workspace.bamboohr_dept_code_list);
    if (allowedDepts.length > 0 && !allowedDepts.includes(department)) {
      res.status(400).json({ error: `Invalid department. Must be one of: ${allowedDepts.join(', ')}` });
      return;
    }
  }

  db.prepare(
    `UPDATE members SET
      name = COALESCE(?, name),
      email = COALESCE(?, email),
      role = COALESCE(?, role),
      department = COALESCE(?, department),
      updated_at = datetime('now')
    WHERE id = ? AND workspace_id = ?`
  ).run(name ?? null, email ?? null, role ?? null, department ?? null, member.id, req.workspace.id);
  const updated = db.prepare(
    'SELECT * FROM members WHERE id = ? AND workspace_id = ?'
  ).get(member.id, req.workspace.id) as unknown as MemberRow;
  res.json(updated);
});

router.delete('/:id', (req: Request, res: Response): void => {
  if (!req.workspace) { res.status(500).json({ error: 'Internal server error' }); return; }
  const db = getDb();
  const member = db.prepare(
    'SELECT * FROM members WHERE id = ? AND workspace_id = ?'
  ).get(Number(req.params.id), req.workspace.id) as unknown as MemberRow | undefined;
  if (!member) {
    res.status(404).json({ error: 'Member not found' });
    return;
  }
  try {
    // Soft-delete: mark inactive and prefix email per TM-101 deactivation flow.
    db.prepare(
      `UPDATE members SET is_active = 0, email = 'deactivated-' || email, updated_at = datetime('now') WHERE id = ? AND workspace_id = ?`
    ).run(member.id, req.workspace.id);
    res.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('UNIQUE')) {
      res.status(409).json({ error: 'Member is already deactivated' });
      return;
    }
    throw err;
  }
});

export default router;
