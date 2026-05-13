import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';

interface FeatureFlagRow {
  key: string;
  value: string;
}

const router: Router = Router();

router.get('/', (req: Request, res: Response): void => {
  const db = getDb();
  try {
    const rows = db.prepare(
      'SELECT key, value FROM feature_flags'
    ).all() as unknown as FeatureFlagRow[];
    const flags: Record<string, string> = {};
    for (const row of rows) {
      flags[row.key] = row.value;
    }
    res.json({ flags });
  } catch (err: unknown) {
    // Partial rollout guard: if the table does not yet exist, return empty flags
    if (
      err instanceof Error &&
      err.message.includes('no such table')
    ) {
      res.json({ flags: {} });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:key', (req: Request, res: Response): void => {
  const db = getDb();
  const { key } = req.params;
  const { value } = req.body as { value?: string };

  if (typeof value !== 'string') {
    res.status(400).json({ error: 'Missing required field: value' });
    return;
  }

  const existing = db.prepare(
    'SELECT key, value FROM feature_flags WHERE key = ?'
  ).get(key) as unknown as FeatureFlagRow | undefined;

  if (!existing) {
    res.status(404).json({ error: 'Feature flag not found' });
    return;
  }

  db.prepare(
    'UPDATE feature_flags SET value = ? WHERE key = ?'
  ).run(value, key);

  const updated = db.prepare(
    'SELECT key, value FROM feature_flags WHERE key = ?'
  ).get(key) as unknown as FeatureFlagRow;

  res.json({ flag: updated });
});

export default router;
