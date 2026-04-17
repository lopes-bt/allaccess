// Lazily-instantiated Neon Postgres client for the /api routes.
//
// When you connect a Neon database to the Vercel project (Storage tab in the
// Vercel dashboard), Vercel will inject DATABASE_URL into every environment.
// POSTGRES_URL is also kept around as a legacy alias.
//
// We defer construction so the function doesn't crash on cold start when the
// env var hasn't been wired up yet — the request handler can then return a
// clean 503 instead of FUNCTION_INVOCATION_FAILED.

import { neon } from '@neondatabase/serverless';

function connectionString() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    ''
  );
}

export function hasDb() {
  return Boolean(connectionString());
}

let _sql = null;
export function getSql() {
  if (_sql) return _sql;
  const cs = connectionString();
  if (!cs) throw new Error('No DATABASE_URL configured. Connect a Neon DB in Vercel → Storage.');
  _sql = neon(cs);
  return _sql;
}
