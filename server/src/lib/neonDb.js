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

  // Auth tables
  await p.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','employee')),
      employee_id INTEGER,
      name TEXT NOT NULL,
      is_default_password INTEGER DEFAULT 0
    );
  `)

  await p.query(`
    CREATE TABLE IF NOT EXISTS employees (
      id SERIAL PRIMARY KEY,
      user_id INTEGER UNIQUE,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      job_position TEXT,
      branch TEXT,
      base_salary_monthly REAL NOT NULL,
      overtime_rate_per_hour REAL NOT NULL,
      leave_credits REAL DEFAULT 15.0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // App tables (used by your other routes)
  await p.query(`
    CREATE TABLE IF NOT EXISTS attendance (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('Present','Leave','Absent')),
      check_in_time TEXT,
      check_out_time TEXT,
      UNIQUE(employee_id, date)
    );
  `)

  await p.query(`
    CREATE TABLE IF NOT EXISTS payrolls (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL,
      period_start TEXT NOT NULL,
      period_end TEXT NOT NULL,
      overtime_hours REAL NOT NULL,
      overtime_pay REAL NOT NULL,
      deductions_amount REAL NOT NULL,
      net_pay REAL NOT NULL,

      status TEXT NOT NULL CHECK(status IN ('Draft','Approved','Paid')) DEFAULT 'Draft',
      approved_at TEXT,
      paid_at TEXT,
      approved_by_admin_id INTEGER,

      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

      UNIQUE(employee_id, period_start, period_end)
    );
  `)

  await p.query(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id SERIAL PRIMARY KEY,
      actor_user_id INTEGER,
      actor_role TEXT,
      action_type TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      metadata_json TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `)

  await p.query(`
    CREATE TABLE IF NOT EXISTS attendance_corrections (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      reason TEXT NOT NULL,
      requested_check_in_time TEXT,
      requested_check_out_time TEXT,
      requested_status TEXT NOT NULL CHECK(requested_status IN ('Present','Leave','Absent')),

      admin_decision TEXT NOT NULL CHECK(admin_decision IN ('Pending','Approved','Rejected')) DEFAULT 'Pending',
      admin_comment TEXT,
      decided_by_admin_id INTEGER,
      decided_at TEXT,

      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(employee_id, date, requested_check_in_time, requested_check_out_time)
    );
  `)

  await p.query(`
    CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value_json TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `)

  await p.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      recipient_employee_id INTEGER,
      recipient_user_id INTEGER,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      created_by_admin_id INTEGER,
      read_at TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `)

  await p.query(`
    CREATE TABLE IF NOT EXISTS travel_orders (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL,
      destination TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      reason TEXT,
      total_cost REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL CHECK(status IN ('Pending','Approved','Rejected')),
      admin_comment TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(employee_id, destination, start_date, end_date)
    );
  `)

  await p.query(`
    CREATE TABLE IF NOT EXISTS overtime_requests (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      check_in_time TEXT NOT NULL,
      check_out_time TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('Pending','Approved','Rejected')),
      admin_comment TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(employee_id, date, check_in_time, check_out_time)
    );
  `)

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

