import express from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { all } from '../lib/db.js'

export const employeeRouter = express.Router()
employeeRouter.use(requireAuth, requireRole('employee'))

employeeRouter.get('/attendance', async (req, res) => {
  const employeeId = req.user.employee_id
  const rows = await all(
    `SELECT id, date, status, check_in_time AS checkInTime, check_out_time AS checkOutTime
     FROM attendance WHERE employee_id=? ORDER BY date DESC`,
    [employeeId]
  )
  res.json(rows)
})

employeeRouter.get('/payroll', async (req, res) => {
  const employeeId = req.user.employee_id
  const rows = await all(
    `SELECT id, period_start AS periodStart, period_end AS periodEnd,
            overtime_hours AS overtimeHours, overtime_pay AS overtimePay,
            deductions_amount AS deductionsAmount, net_pay AS netPay
     FROM payrolls WHERE employee_id=? ORDER BY period_start DESC`,
    [employeeId]
  )
  res.json(rows)
})

