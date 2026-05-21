import sqlite3 from 'sqlite3'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

import { hashPassword } from './password.js'
import { initNeonDb, getPool } from './neonDb.js'

// Neon is enabled when DATABASE_URL is set.
function isNeon() {
  return !!process.env.DATABASE_URL
}

dotenv.config()

// SQLite fallback connection
let sqliteDb

function ensureNeonPool() {
  return getPool()
}


export async function initDb() {
  // Backward-compatible initializer: initNeonDb if configured, else SQLite.
  if (isNeon()) return initNeonDb()
  const dbPath = process.env.DB_PATH || './data/payroll.db'
  const abs = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath)
  const dir = path.dirname(abs)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  sqliteDb = await new Promise((resolve, reject) => {
    const instance = new sqlite3.Database(abs, (err) => {
      if (err) reject(err)
      else resolve(instance)
    })
  })

  await sqliteRun(`PRAGMA foreign_keys = ON;`)

  // --- Schema for SQLite fallback (unchanged from your original) ---
  await sqliteRun(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','employee')),
      employee_id INTEGER,
      name TEXT NOT NULL,
      is_default_password INTEGER DEFAULT 0
    );
  `)

  await sqliteRun(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      job_position TEXT,
      branch TEXT,
      base_salary_monthly REAL NOT NULL,
      overtime_rate_per_hour REAL NOT NULL,
      leave_credits REAL DEFAULT 15.0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)

  async function addColumnIfMissing(table, columnName, definition) {
    const currentColumns = await sqliteAll(`PRAGMA table_info(${table})`)
    if (!currentColumns.some((c) => c.name === columnName)) {
      await sqliteRun(`ALTER TABLE ${table} ADD COLUMN ${columnName} ${definition}`)
    }
  }

  async function ensureTableConstraint(tableName, oldCheckSql, newTableSql, columns) {
    const row = await sqliteGet(`SELECT sql FROM sqlite_master WHERE type='table' AND name=?`, [tableName])
    if (row?.sql?.includes(oldCheckSql)) {
      await sqliteRun(`ALTER TABLE ${tableName} RENAME TO ${tableName}_old`)
      await sqliteRun(newTableSql)
      await sqliteRun(`INSERT INTO ${tableName} (${columns}) SELECT ${columns} FROM ${tableName}_old`)
      await sqliteRun(`DROP TABLE ${tableName}_old`)
    }
  }

  await addColumnIfMissing('employees', 'job_position', 'TEXT')
  await addColumnIfMissing('users', 'is_default_password', 'INTEGER DEFAULT 0')
  await addColumnIfMissing('employees', 'branch', 'TEXT')
  await addColumnIfMissing('employees', 'leave_credits', 'REAL DEFAULT 15.0')

  await sqliteRun(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('Present','Leave','Absent')),
      check_in_time TEXT,
      check_out_time TEXT,
      UNIQUE(employee_id, date)
    );
  `)

  await ensureTableConstraint(
    'attendance',
    "CHECK(status IN ('Present','Leave'))",
    `CREATE TABLE attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('Present','Leave','Absent')),
      check_in_time TEXT,
      check_out_time TEXT,
      UNIQUE(employee_id, date)
    );`,
    'id, employee_id, date, status, check_in_time, check_out_time'
  )

  await sqliteRun(`
    CREATE TABLE IF NOT EXISTS payrolls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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

      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

      UNIQUE(employee_id, period_start, period_end)
    );
  `)

  await addColumnIfMissing('payrolls', 'status', 'TEXT')
  await addColumnIfMissing('payrolls', 'approved_at', 'TEXT')
  await addColumnIfMissing('payrolls', 'paid_at', 'TEXT')
  await addColumnIfMissing('payrolls', 'approved_by_admin_id', 'INTEGER')
  await addColumnIfMissing('payrolls', 'created_at', 'TEXT')
  await addColumnIfMissing('payrolls', 'updated_at', 'TEXT')

  await sqliteRun(`UPDATE payrolls SET status='Draft' WHERE status IS NULL`)
  await sqliteRun(`UPDATE payrolls SET created_at=CURRENT_TIMESTAMP WHERE created_at IS NULL`)
  await sqliteRun(`UPDATE payrolls SET updated_at=CURRENT_TIMESTAMP WHERE updated_at IS NULL`)

  await sqliteRun(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_user_id INTEGER,
      actor_role TEXT,
      action_type TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      metadata_json TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)

  await sqliteRun(`
    CREATE TABLE IF NOT EXISTS attendance_corrections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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

      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(employee_id, date, requested_check_in_time, requested_check_out_time)
    );
  `)

  await ensureTableConstraint(
    'attendance_corrections',
    "CHECK(requested_status IN ('Present','Leave'))",
    `CREATE TABLE attendance_corrections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(employee_id, date, requested_check_in_time, requested_check_out_time)
    );`,
    'id, employee_id, date, reason, requested_check_in_time, requested_check_out_time, requested_status, admin_decision, admin_comment, decided_by_admin_id, decided_at, created_at'
  )

  await sqliteRun(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value_json TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)

  await sqliteRun(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipient_employee_id INTEGER,
      recipient_user_id INTEGER,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      created_by_admin_id INTEGER,
      read_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)

  await sqliteRun(`
    CREATE TABLE IF NOT EXISTS travel_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      destination TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      reason TEXT,
      total_cost REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL CHECK(status IN ('Pending','Approved','Rejected')),
      admin_comment TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(employee_id, destination, start_date, end_date)
    );
  `)

  await sqliteRun(`
    CREATE TABLE IF NOT EXISTS overtime_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      check_in_time TEXT NOT NULL,
      check_out_time TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('Pending','Approved','Rejected')),
      admin_comment TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(employee_id, date, check_in_time, check_out_time)
    );
  `)

  // Seed default admin
  const adminEmail = process.env.NEON_ADMIN_EMAIL || 'admin@example.com'
  const adminPass = process.env.NEON_ADMIN_PASS || 'admin123'
  const existing = await sqliteGet(`SELECT id FROM users WHERE role='admin' AND email=?`, [adminEmail])
  if (!existing) {
    const passwordHash = await hashPassword(adminPass)
    await sqliteRun(`
      INSERT INTO users (email, password_hash, role, employee_id, name)
      VALUES (?,?,?,?,?)
    `, [adminEmail, passwordHash, 'admin', null, 'Administrator'])
    console.log(`Seeded admin user ${adminEmail} / ${adminPass}`)
  }
}

export function getDb() {
  return sqliteDb
}

// --- Public query helpers ---
export async function exec(sql, params = []) {
  if (isNeon()) {
    const pool = ensureNeonPool()
    await pool.query(sql, params)
    return { lastID: undefined }
  }
  return sqliteRun(sql, params)
}

export async function getOne(sql, params = []) {
  if (isNeon()) {
    const res = await neonQuery(sql, params)
    return res?.rows?.[0] ?? null
  }
  return sqliteGet(sql, params)
}

export async function all(sql, params = []) {
  if (isNeon()) {
    const res = await neonQuery(sql, params)
    return Array.isArray(res?.rows) ? res.rows : []
  }
  return sqliteAll(sql, params)
}


// --- SQLite helpers ---
function sqliteRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    sqliteDb.run(sql, params, function (err) {
      if (err) reject(err)
      else resolve({ lastID: this.lastID })
    })
  })
}

function sqliteGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    sqliteDb.get(sql, params, (err, row) => {
      if (err) reject(err)
      else resolve(row)
    })
  })
}

function sqliteAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    sqliteDb.all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

async function neonQuery(sql, params) {
  // Debug: helps identify malformed SQL being sent to Neon/Postgres
  console.log('[NEON QUERY]', { sql: String(sql).slice(0, 5000), params })
  const pool = ensureNeonPool()
  const res = await pool.query(sql, params)
  return res
}



