import 'server-only';

import { Pool } from 'pg';

const globalForVyra = globalThis as typeof globalThis & {
  vyraNeonPool?: Pool;
};

export function getNeonAdminPool(): Pool | null {
  const connectionString = process.env.NEON_DATABASE_URL;
  if (!connectionString) return null;

  if (!globalForVyra.vyraNeonPool) {
    globalForVyra.vyraNeonPool = new Pool({
      connectionString,
      max: 2,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
      allowExitOnIdle: true,
    });
  }

  return globalForVyra.vyraNeonPool;
}
