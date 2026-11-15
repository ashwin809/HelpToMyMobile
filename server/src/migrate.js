import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { pool } from './db.js';

const here = dirname(fileURLToPath(import.meta.url));
const migrations = [
  { version: '001_initial', path: resolve(here, '../../schema.sql') },
  { version: '002_password_reset_tokens', path: resolve(here, '../migrations/002_password_reset_tokens.sql') },
  { version: '003_growth_features', path: resolve(here, '../migrations/003_growth_features.sql') },
  { version: '004_circle_discussions', path: resolve(here, '../migrations/004_circle_discussions.sql') },
  { version: '005_profile_setup', path: resolve(here, '../migrations/005_profile_setup.sql') },
  { version: '006_multi_roles_activity', path: resolve(here, '../migrations/006_multi_roles_activity.sql') },
  { version: '007_google_calendar', path: resolve(here, '../migrations/007_google_calendar.sql') },
  { version: '008_connection_request_preferences', path: resolve(here, '../migrations/008_connection_request_preferences.sql') },
  { version: '009_reopen_cancelled_office_hours', path: resolve(here, '../migrations/009_reopen_cancelled_office_hours.sql') },
];
const client = await pool.connect();

try {
  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(100) PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  for (const migration of migrations) {
    const existing = await client.query('SELECT 1 FROM schema_migrations WHERE version = $1', [migration.version]);
    if (existing.rowCount) continue;
    const sql = await readFile(migration.path, 'utf8');
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [migration.version]);
      await client.query('COMMIT');
      console.info(`Applied database schema ${migration.version}.`);
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    }
  }
  console.info('Database schema is up to date.');
} catch (error) {
  throw error;
} finally {
  client.release();
  await pool.end();
}
