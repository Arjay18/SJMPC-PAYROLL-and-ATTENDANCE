import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

let pool

export function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL is not configured for Neon/Postgres')
    }

    pool = new Pool({
      connectionString,
      ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false },
    })
  }
  return pool
}

export async function initNeonDb() {
  const p = getPool()

  await p.query('CREATE TABLE IF NOT EXISTS users (\n      id SERIAL PRIMARY KEY,\n      email TEXT UNIQUE NOT NULL,\n      password_hash TEXT NOT NULL,\n      role TEXT NOT NULL CHECK(role IN (\'admin\',\'employee\')),\n      employee_id INTEGER,\n      name TEXT NOT NULL,\n      is_default_password INTEGER DEFAULT 0\n  );')

  await p.query('CREATE TABLE IF NOT EXISTS employees (\n      id SERIAL PRIMARY KEY,\n      user_id INTEGER UNIQUE,\n      name TEXT NOT NULL,\n      email TEXT UNIQUE NOT NULL,\n      job_position TEXT,\n      branch TEXT,\n      base_salary_monthly REAL NOT NULL,\n      overtime_rate_per_hour REAL NOT NULL,\n      leave_credits REAL DEFAULT 15.0,\n      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP\n  );')

  // Seed default admin (idempotent)
  const adminEmail = process.env.NEON_ADMIN_EMAIL || 'admin@example.com'
  const adminPass = process.env.NEON_ADMIN_PASS || 'admin123'

  const existing = await p.query('SELECT id FROM users WHERE role=\'admin\' AND email=$1', [adminEmail])
  if (existing.rows.length === 0) {
    const { hashPassword } = await import('./password.js')
    const passwordHash = await hashPassword(adminPass)

    await p.query(
      'INSERT INTO users (email, password_hash, role, employee_id, name, is_default_password) VALUES ($1,$2,$3,$4,$5,0)',
      [adminEmail, passwordHash, 'admin', null, 'Administrator']
    )

    console.log(`Seeded admin user ${adminEmail} / ${adminPass}`)
  }
}

export async function query(sql, params = []) {
  const p = getPool()
  const res = await p.query(sql, params)
  return res
}

