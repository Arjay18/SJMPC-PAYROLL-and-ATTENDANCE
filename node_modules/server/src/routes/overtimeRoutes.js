import express from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { all, exec, getOne } from '../lib/db.js'

export const overtimeRouter = express.Router()

overtimeRouter.use(requireAuth)

async function getActorBranch(req) {
  if (req.user.role === 'admin') return null
  const row = await getOne(`SELECT e.branch FROM users u JOIN employees e ON u.employee_id = e.id WHERE u.id = ?`, [req.user.id])
  return row?.branch || null
}

// Employee submit overtime request (date + start/end time)
overtimeRouter.post('/submit', requireRole('employee'), async (req, res) => {
  const { date, checkInTime, checkOutTime } = req.body || {}
  if(!date || !checkInTime || !checkOutTime) {
    return res.status(400).json({ message:'date, checkInTime, checkOutTime required' })
  }

  const employeeId = req.user.employee_id

  await exec(
    `INSERT INTO overtime_requests (employee_id, date, check_in_time, check_out_time, status)
     VALUES (?,?,?,?, 'Pending')`,
    [employeeId, date, checkInTime, checkOutTime]
  )

  res.json({ ok:true })
})

// Employee: view own requests
overtimeRouter.get('/employee/my', requireRole('employee'), async (req, res) => {
  const employeeId = req.user.employee_id
  const rows = await all(
    `SELECT id, date,
            check_in_time AS checkInTime,
            check_out_time AS checkOutTime,
            status,
            admin_comment AS adminComment,
            created_at AS createdAt
     FROM overtime_requests
     WHERE employee_id=?
     ORDER BY date DESC, created_at DESC`,
    [employeeId]
  )
  res.json(rows)
})

// Admin: list all requests
overtimeRouter.get('/admin/list', async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'branch_admin') {
    return res.status(403).json({ message: 'Forbidden' })
  }

  const branch = await getActorBranch(req)
  let sql = `SELECT r.id,
                    e.name AS employeeName,
                    e.email AS employeeEmail,
                    r.date,
                    r.check_in_time AS checkInTime,
                    r.check_out_time AS checkOutTime,
                    r.status,
                    r.admin_comment AS adminComment,
                    r.created_at AS createdAt
             FROM overtime_requests r
             JOIN employees e ON e.id=r.employee_id`
  const params = []

  if (branch) {
    sql += ` WHERE e.branch = ?`
    params.push(branch)
  }

  sql += ` ORDER BY r.created_at DESC`
  const rows = await all(sql, params)
  res.json(rows)
})

// Admin: approve/reject
overtimeRouter.post('/admin/decision', async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'branch_admin') {
    return res.status(403).json({ message: 'Forbidden' })
  }

  const { id, decision, adminComment } = req.body || {}
  if(!id || !decision) return res.status(400).json({ message:'id and decision required' })
  if(!['Approved','Rejected'].includes(decision)) return res.status(400).json({ message:'decision must be Approved or Rejected' })

  const branch = await getActorBranch(req)
  if (branch) {
    const request = await getOne(
      `SELECT r.id FROM overtime_requests r JOIN employees e ON r.employee_id = e.id WHERE r.id = ? AND e.branch = ?`,
      [Number(id), branch]
    )
    if (!request) return res.status(403).json({ message: 'Access denied: record belongs to another branch' })
  }

  await exec(
    `UPDATE overtime_requests
     SET status=?, admin_comment=?, updated_at=CURRENT_TIMESTAMP
     WHERE id=?`,
    [decision, adminComment || null, Number(id)]
  )
  res.json({ ok:true })
})
