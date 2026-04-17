// GET /api/submissions?key=<ADMIN_KEY>
// Returns recent submissions as JSON. Protected by a shared secret stored in
// the ADMIN_KEY environment variable on Vercel.
//
// Examples:
//   curl 'https://allaccess.co/api/submissions?key=YOUR_ADMIN_KEY'
//   curl 'https://allaccess.co/api/submissions?key=YOUR_ADMIN_KEY&limit=50'

import { getSql, hasDb } from './_db.js';

export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const expected = process.env.ADMIN_KEY;
  if (!expected) {
    return res.status(500).json({ error: 'ADMIN_KEY env var not configured.' });
  }

  const provided = String(req.query.key || req.headers['x-admin-key'] || '');
  if (provided !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!hasDb()) {
    return res.status(503).json({ error: 'Database not configured yet.' });
  }

  const rawLimit = parseInt(req.query.limit, 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 500) : 100;

  try {
    const sql = getSql();
    const rows = await sql`
      SELECT id, name, email, phone, message, created_at, ip
      FROM submissions
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return res.status(200).json({ count: rows.length, submissions: rows });
  } catch (err) {
    console.error('[/api/submissions]', err);
    return res.status(500).json({ error: 'Could not fetch submissions.' });
  }
}
