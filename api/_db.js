// Shared Neon Postgres client for the /api routes.
//
// When you connect a Neon database to the Vercel project (Storage tab in the
// Vercel dashboard), Vercel will automatically inject DATABASE_URL into every
// environment. POSTGRES_URL is also kept around as a legacy alias.

import { neon } from '@neondatabase/serverless';

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  '';

if (!connectionString) {
  // Don't throw at import time — let the request handler surface a clean error
  // instead of crashing the function cold start.
  console.warn('[db] No DATABASE_URL / POSTGRES_URL set. Connect a Neon DB in Vercel → Storage.');
}

export const sql = neon(connectionString);
export const hasDb = Boolean(connectionString);
