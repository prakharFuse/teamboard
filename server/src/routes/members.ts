import { Router, Request, Response } from 'express';
import { getDb, writeAuditLog } from '../db.js';

interface MemberRow {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  start_date: string;
  is_active: number;
  created_at: string;
  updated_at: string;
  workspace_id: number;
}

interface WorkspaceRow {
  bamboohr_dept_code_list: string;
}

const router: Router = Router();

// Validate a department string against the workspace's bamboohr_dept_code_list.
// Returns true when the list is empty (no restriction) or the department is in the list.
function isDepartmentValid(
  db: ReturnType<typeof getDb>,
  workspaceId: number,
  department: string
): boolean {
  const workspace = db
    .prepare('SELECT bamboohr_dept_code_list FROM workspaces WHERE id = ?')
    .get(workspaceId) as unknown as WorkspaceRow | undefined;

  if (!workspace) return true;

  let deptList: string[] = [];
  try {
    deptList = JSON.parse(workspace.bamboohr_dept_code_list) as string[];
  } catch {
    return true;
  }

  if (deptList.length === 0) return true;

  return deptList.includes(department);
}

// GET / – list active members for the current workspace, with optional department filter
router.get('/', (req: Request, res: Response): void => {
  const db = getDb();
  const { department } = req.query;

  let rows: MemberRow[];
  if (department) {
    rows = db
      .prepare(
        'SELECT * FROM members WHERE is_active = 1 AND workspace_id = ? AND department = ? ORDER BY name ASC'
      )
      .all(req.workspaceId, String(department)) as unknown as MemberRow[];
  } else {
    rows = db
      .prepare(
        'SELECT * FROM members WHERE is_active = 1 AND workspace_id = ? ORDER BY name ASC'
      )
      .all(req.workspaceId) as unknown as MemberRow[];
  }

  res.json({ members: rows });
});

// POST / – create a new member in the current workspace
router.post('/', (req: Request, res: Response): void => {
  const { name, email, role, department, start_date } = req.body as {
    name?: string;
    email?: string;
    role?: string;
    department?: string;
    start_date?: string;
  };

  if (!name || !email || !role || !department || !start_date) {
    res.status(400).json({ error: 'Missing required fields: name, email, role, department, start_date' });
    return;
  }

  const db = getDb();

  // Validate department against workspace's bamboohr_dept_code_list before inserting
  if (!isDepartmentValid(db, req.workspaceId, department)) {
    res.status(400).json({ error: `Department '${department}' is not valid for this workspace` });
    return;
  }

  try {
    const result = db
      .prepare(
        'INSERT INTO members (name, email, role, department, start_date, workspace_id) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(name, email, role, department, start_date, req.workspaceId);

    const newId = Number(result.lastInsertRowid);
    const member = db
      .prepare('SELECT * FROM members WHERE id = ?')
      .get(newId) as unknown as MemberRow;

    writeAuditLog(db, {
      actor_email: req.actorEmail,
      workspace_id: req.workspaceId,
      action: 'member.create',
      entity_id: newId,
    });

    res.status(201).json(member);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('UNIQUE')) {
      res.status(409).json({ error: 'A member with this email already exists' });
      return;
    }
    throw err;
  }
});

// GET /export – workspace-scoped CSV download
router.get('/export', (req: Request, res: Response): void => {
  const db = getDb();
  const rows = db
    .prepare(
      'SELECT * FROM members WHERE workspace_id = ? ORDER BY name ASC'
    )
    .all(req.workspaceId) as unknown as MemberRow[];

  const header = 'id,name,email,role,department,start_date,is_active';
  const csv = [
    header,
    ...rows.map(
      (r) =>
        `${r.id},${r.name},${r.email},${r.role},${r.department},${r.start_date},${r.is_active}`
    ),
  ].join('\n');

  writeAuditLog(db, {
    actor_email: req.actorEmail,
    workspace_id: req.workspaceId,
    action: 'member.export',
    entity_id: null,
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="members.csv"');
  res.send(csv);
});

// GET /stats – headcount statistics scoped to the current workspace
router.get('/stats', (req: Request, res: Response): void => {
  const db = getDb();
  const total = db
    .prepare(
      'SELECT COUNT(*) as count FROM members WHERE is_active = 1 AND workspace_id = ?'
    )
    .get(req.workspaceId) as unknown as { count: number };
  const byDept = db
    .prepare(
      'SELECT department, COUNT(*) as count FROM members WHERE is_active = 1 AND workspace_id = ? GROUP BY department ORDER BY count DESC'
    )
    .all(req.workspaceId) as unknown as { department: string; count: number }[];
  res.json({ total: total.count, byDepartment: byDept });
});

// GET /:id – fetch a single member (workspace-scoped to prevent cross-workspace reads)
router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb();
  const member = db
    .prepare('SELECT * FROM members WHERE id = ? AND workspace_id = ?')
    .get(Number(req.params.id), req.workspaceId) as unknown as MemberRow | undefined;
  if (!member) {
    res.status(404).json({ error: 'Member not found' });
    return;
  }
  res.json(member);
});

// PATCH /:id – update a member (workspace-scoped)
router.patch('/:id', (req: Request, res: Response): void => {
  const db = getDb();
  const member = db
    .prepare('SELECT * FROM members WHERE id = ? AND workspace_id = ?')
    .get(Number(req.params.id), req.workspaceId) as unknown as MemberRow | undefined;
  if (!member) {
    res.status(404).json({ error: 'Member not found' });
    return;
  }

  const { name, email, role, department } = req.body as {
    name?: string;
    email?: string;
    role?: string;
    department?: string;
  };

  // Validate new department value against workspace's bamboohr_dept_code_list if provided
  if (department !== undefined && !isDepartmentValid(db, req.workspaceId, department)) {
    res.status(400).json({ error: `Department '${department}' is not valid for this workspace` });
    return;
  }

  db.prepare(
    `UPDATE members SET
      name = COALESCE(?, name),
      email = COALESCE(?, email),
      role = COALESCE(?, role),
      department = COALESCE(?, department),
      updated_at = datetime('now')
    WHERE id = ? AND workspace_id = ?`
  ).run(name ?? null, email ?? null, role ?? null, department ?? null, member.id, req.workspaceId);

  const updated = db
    .prepare('SELECT * FROM members WHERE id = ?')
    .get(member.id) as unknown as MemberRow;

  writeAuditLog(db, {
    actor_email: req.actorEmail,
    workspace_id: req.workspaceId,
    action: 'member.update',
    entity_id: member.id,
  });

  res.json(updated);
});

// DELETE /:id – soft-delete: deactivate and prefix email, write audit log
router.delete('/:id', (req: Request, res: Response): void => {
  const db = getDb();
  const member = db
    .prepare('SELECT * FROM members WHERE id = ? AND workspace_id = ?')
    .get(Number(req.params.id), req.workspaceId) as unknown as MemberRow | undefined;
  if (!member) {
    res.status(404).json({ error: 'Member not found' });
    return;
  }

  db.prepare(
    `UPDATE members SET
      is_active = 0,
      email = CASE WHEN email NOT LIKE 'deactivated-%' THEN 'deactivated-' || email ELSE email END,
      updated_at = datetime('now')
    WHERE id = ? AND workspace_id = ?`
  ).run(member.id, req.workspaceId);

  writeAuditLog(db, {
    actor_email: req.actorEmail,
    workspace_id: req.workspaceId,
    action: 'member.delete',
    entity_id: member.id,
  });

  res.json({ success: true });
});

export default router;
