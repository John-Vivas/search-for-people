/**
 * Applies Phase 4 emergency_zones migrations to Supabase.
 *
 * Requires SUPABASE_DB_URL in .env (Database URI from Supabase dashboard).
 * Example: postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
 *
 * Usage: node scripts/apply-zones-migration.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env' });

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, '..', 'supabase', 'migrations');

const dbUrl = process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL;

if (!dbUrl) {
  console.error(
    'Missing SUPABASE_DB_URL in .env — add your Supabase database connection string and retry.'
  );
  process.exit(1);
}

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  console.log(`Applying ${files.length} migration(s)...`);

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), 'utf8');
    console.log(`→ ${file}`);
    await client.query(sql);
  }

  const { rows } = await client.query(
    'select count(*)::int as n from public.emergency_zones where is_active = true'
  );
  console.log(`Done. Active emergency_zones: ${rows[0].n}`);
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exit(1);
} finally {
  await client.end();
}
