// POST /api/contact
// Validates a contact submission and stores it in the `submissions` table.
// Auto-creates the table on first request (idempotent).
//
// Required env var (set automatically when you connect a Neon database to the
// Vercel project): DATABASE_URL

import { getSql, hasDb } from './_db.js';

export const config = { runtime: 'nodejs' };

let tableEnsured = false;
async function ensureTable(sql) {
  if (tableEnsured) return;
  await sql`
    CREATE TABLE IF NOT EXISTS submissions (
      id           SERIAL PRIMARY KEY,
      name         TEXT NOT NULL,
      email        TEXT NOT NULL,
      phone        TEXT,
      message      TEXT NOT NULL,
      ip           TEXT,
      user_agent   TEXT,
      referrer     TEXT,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS submissions_created_at_idx ON submissions (created_at DESC)`;
  tableEnsured = true;
}

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());

function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.socket?.remoteAddress || null;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!hasDb()) {
    return res.status(503).json({ error: 'Database not configured yet.' });
  }

  // Vercel auto-parses JSON when Content-Type is application/json
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  // Honeypot — bots fill this; humans never see it. Pretend success.
  if (body.botcheck) return res.status(200).json({ success: true });

  const name    = String(body.name    || '').trim();
  const email   = String(body.email   || '').trim();
  const phone   = String(body.phone   || '').trim();
  const message = String(body.message || '').trim();

  if (!name    || name.length    > 200)  return res.status(400).json({ error: 'Name is required.' });
  if (!isEmail(email))                   return res.status(400).json({ error: 'A valid email is required.' });
  if (!message || message.length > 5000) return res.status(400).json({ error: 'Message is required.' });
  if (phone.length > 50)                 return res.status(400).json({ error: 'Phone is too long.' });

  const ip       = clientIp(req);
  const ua       = req.headers['user-agent'] || null;
  const referrer = req.headers.referer || req.headers.referrer || null;

  try {
    const sql = getSql();
    await ensureTable(sql);
    const rows = await sql`
      INSERT INTO submissions (name, email, phone, message, ip, user_agent, referrer)
      VALUES (${name}, ${email}, ${phone || null}, ${message}, ${ip}, ${ua}, ${referrer})
      RETURNING id, created_at
    `;
    return res.status(200).json({
      success: true,
      id: rows[0].id,
      created_at: rows[0].created_at,
    });
  } catch (err) {
    console.error('[/api/contact]', err);
    return res.status(500).json({ error: 'Could not save submission. Please try again.' });
  }
}
