import express from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { all, exec, getOne } from '../lib/db.js'

export const travelRouter = express.Router()

// Employee submits
travelRouter.use(requireAuth)

async function getActorBranch(req) {
  if (req.user.role === 'admin') return null
  const row = await getOne(`SELECT e.branch FROM users u JOIN employees e ON u.employee_id = e.id WHERE u.id = ?`, [req.user.id])
  return row?.branch || null
}

travelRouter.post('/submit', requireRole('employee'), async (req, res) => {
  const {
    destination,
    startDate,
    endDate,
    reason,
    totalCost,
  } = req.body || {}

  if(!destination || !startDate || !endDate) {
    return res.status(400).json({ message:'destination, startDate, endDate required' })
  }

  const employeeId = req.user.employee_id

  await exec(
    `INSERT INTO travel_orders (employee_id, destination, start_date, end_date, reason, total_cost, status)
     VALUES (?,?,?,?,?,?, 'Pending')`,
    [employeeId, destination, startDate, endDate, reason || null, Number(totalCost || 0)]
  )

  res.json({ ok:true })
})

// Admin approve/reject + list all
travelRouter.get('/admin/list', async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'branch_admin') {
    return res.status(403).json({ message: 'Forbidden' })
  }

  const branch = await getActorBranch(req)
  let sql = `SELECT t.id, e.name AS employeeName, e.email AS employeeEmail,
                    t.destination, t.start_date AS startDate, t.end_date AS endDate,
                    t.reason, t.total_cost AS totalCost,
                    t.status, t.admin_comment AS adminComment,
                    t.created_at AS createdAt
             FROM travel_orders t
             JOIN employees e ON e.id=t.employee_id`
  const params = []

  if (branch) {
    sql += ` WHERE e.branch = ?`
    params.push(branch)
  }

  sql += ` ORDER BY t.created_at DESC`
  const rows = await all(sql, params)
  res.json(rows)
})

travelRouter.post('/admin/decision', async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'branch_admin') {
    return res.status(403).json({ message: 'Forbidden' })
  }

  const { id, decision, adminComment } = req.body || {}
  if(!id || !decision) return res.status(400).json({ message:'id and decision required' })
  if(!['Approved','Rejected'].includes(decision)) return res.status(400).json({ message:'decision must be Approved or Rejected' })

  const branch = await getActorBranch(req)
  if (branch) {
    const order = await getOne(
      `SELECT t.id FROM travel_orders t JOIN employees e ON t.employee_id = e.id WHERE t.id = ? AND e.branch = ?`,
      [Number(id), branch]
    )
    if (!order) return res.status(403).json({ message: 'Access denied: record belongs to another branch' })
  }

  await exec(
    `UPDATE travel_orders
     SET status=?, admin_comment=?, updated_at=CURRENT_TIMESTAMP
     WHERE id=?`,
    [decision, adminComment || null, Number(id)]
  )

  res.json({ ok:true })
})

// Employee view own
travelRouter.get('/employee/my', requireRole('employee'), async (req, res) => {
  const employeeId = req.user.employee_id
  const rows = await all(
    `SELECT id, destination,
            start_date AS startDate,
            end_date AS endDate,
            reason,
            total_cost AS totalCost,
            status,
            admin_comment AS adminComment,
            created_at AS createdAt
     FROM travel_orders
     WHERE employee_id=?
     ORDER BY created_at DESC`,
    [employeeId]
  )
  res.json(rows)
})
