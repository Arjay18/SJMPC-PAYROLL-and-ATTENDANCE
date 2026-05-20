import express from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { all, exec, getOne } from '../lib/db.js'
import { hashPassword } from '../lib/password.js'
import { computeOvertimeHours } from '../lib/overtime.js'
import { computeStatutoryDeductions } from '../lib/deductions.js'

/**
 * Converts a number to its word representation for the payslip.
 */
function numberToWords(num) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  function convert_thousands(n) {
    if (n >= 1000) return convert_thousands(Math.floor(n / 1000)) + " Thousand " + convert_hundreds(n % 1000);
    return convert_hundreds(n);
  }

  function convert_hundreds(n) {
    if (n > 99) return ones[Math.floor(n / 100)] + " Hundred " + convert_tens(n % 100);
    return convert_tens(n);
  }

  function convert_tens(n) {
    if (n < 10) return ones[n];
    if (n >= 10 && n < 20) return teens[n - 10];
    return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
  }

  if (num === 0) return "Zero Pesos Only";
  const whole = Math.floor(num);
  const cents = Math.round((num - whole) * 100);
  let result = convert_thousands(whole).trim();
  if (cents > 0) result += ` and ${cents}/100`;
  return result + " Pesos Only";
}

function addDays(dateStr, days){
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0,10)
}

export const adminRouter = express.Router()
adminRouter.use(requireAuth)

// Custom middleware to allow both Super Admin and Branch Admin
adminRouter.use((req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'branch_admin') return next()
  res.status(403).json({ message: 'Forbidden' })
})

// Helper to get user's assigned branch for filtering
async function getActorBranch(req) {
  if (req.user.role === 'admin') return null
  const row = await getOne(`SELECT e.branch FROM users u JOIN employees e ON u.employee_id = e.id WHERE u.id = ?`, [req.user.id])
  return row?.branch || null
}

adminRouter.get('/stats', async (req, res) => {
  const branch = await getActorBranch(req)

  let empSql = `SELECT COUNT(*) as count FROM employees`
  let attSql = `SELECT COUNT(*) as count FROM attendance`
  let paySql = `SELECT COUNT(*) as count FROM payrolls`
  let lastSql = `SELECT created_at FROM payrolls ORDER BY created_at DESC LIMIT 1`
  const params = []

  if (branch) {
    empSql = `SELECT COUNT(*) as count FROM employees WHERE branch = ?`
    attSql = `SELECT COUNT(a.id) as count FROM attendance a JOIN employees e ON a.employee_id = e.id WHERE e.branch = ?`
    paySql = `SELECT COUNT(p.id) as count FROM payrolls p JOIN employees e ON p.employee_id = e.id WHERE e.branch = ?`
    lastSql = `SELECT p.created_at FROM payrolls p JOIN employees e ON p.employee_id = e.id WHERE e.branch = ? ORDER BY p.created_at DESC LIMIT 1`
    params.push(branch)
  }

  const empRes = await getOne(empSql, params)
  const attRes = await getOne(attSql, params)
  const payRes = await getOne(paySql, params)
  const lastRes = await getOne(lastSql, params)

  res.json({
    employees: empRes.count,
    attendanceRecords: attRes.count,
    payrolls: payRes.count,
    lastPayrollGeneratedAt: lastRes?.created_at || null
  })
})

adminRouter.get('/employees', async (req, res) => {
  const branch = await getActorBranch(req)
  let sql = `SELECT id, name, email, job_position AS jobPosition, branch, base_salary_monthly AS baseSalaryMonthly, overtime_rate_per_hour AS overtimeRatePerHour, job_description AS jobDescription, gender, employment_status AS employmentStatus, leave_credits AS leaveCredits FROM employees`
  const params = []
  
  if (branch) {
    sql += ` WHERE branch = ?`
    params.push(branch)
  }
  
  sql += ` ORDER BY id DESC`
  const rows = await all(sql, params)
  res.json(rows)
})

adminRouter.post('/employees', async (req, res) => {
  const { name, email, jobPosition, branch, baseSalaryMonthly, overtimeRatePerHour, leaveCredits, role } = req.body || {}
  if(!name || !email) return res.status(400).json({ message:'name and email required' })

  const gender = req.body.gender || 'Not Specified'
  const status = req.body.employmentStatus || 'Active'

  const existingEmployee = await getOne(`SELECT id FROM employees WHERE email=?`, [email])
  if(existingEmployee) return res.status(409).json({ message:'Employee email already exists' })

  // Default employee password
  const defaultPassword = '123456'
  const passwordHash = await hashPassword(defaultPassword)

  const result = await exec(
    `INSERT INTO employees (name, email, job_position, branch, base_salary_monthly, overtime_rate_per_hour, leave_credits, job_description, gender, employment_status) VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [name, email, jobPosition || null, branch || null, Number(baseSalaryMonthly), Number(overtimeRatePerHour), Number(leaveCredits || 15), req.body.jobDescription || null, gender, status]
  )

  // employee row has id via result.lastID
  const employeeId = result.lastID

  await exec(
    `INSERT INTO users (email, password_hash, role, employee_id, name, is_default_password) VALUES (?,?,?,?,?,?)`,
    [email, passwordHash, role || 'employee', employeeId, name, 1]
  )

  res.json({ ok:true, employeeId })
})

adminRouter.put('/employees/:id', async (req, res) => {
  const employeeId = req.params.id
  const { name, email, jobPosition, branch, baseSalaryMonthly, overtimeRatePerHour, jobDescription, gender, employmentStatus, leaveCredits } = req.body || {}

  if(!employeeId || !name || !email) return res.status(400).json({ message:'employeeId, name, and email required' })

  await exec(
    `UPDATE employees SET
       name = ?,
       email = ?,
       job_position = ?,
       branch = ?,
       base_salary_monthly = ?,
       overtime_rate_per_hour = ?,
       job_description = ?,
       gender = ?,
       employment_status = ?
     WHERE id = ?`,
    [name, email, jobPosition || null, branch || null, Number(baseSalaryMonthly), Number(overtimeRatePerHour), jobDescription || null, gender, employmentStatus, Number(employeeId)]
  )

  res.json({ ok:true })
})

adminRouter.delete('/employees/:id', async (req, res) => {
  const employeeId = Number(req.params.id)
  if(!employeeId) return res.status(400).json({ message:'Invalid employee ID' })

  // Check if employee exists
  const employee = await getOne(`SELECT id, name FROM employees WHERE id=?`, [employeeId])
  if(!employee) return res.status(404).json({ message:'Employee not found' })

  // Delete associated user account
  await exec(`DELETE FROM users WHERE employee_id=?`, [employeeId])
  // Delete associated attendance records
  await exec(`DELETE FROM attendance WHERE employee_id=?`, [employeeId])
  // Delete associated payroll records
  await exec(`DELETE FROM payrolls WHERE employee_id=?`, [employeeId])
  // Delete the employee
  await exec(`DELETE FROM employees WHERE id=?`, [employeeId])

  await exec(
    `INSERT INTO audit_log (actor_user_id, actor_role, action_type, entity_type, entity_id, metadata_json)
     VALUES (?,?,?,?,?,?)`,
    [req.user.id, req.user.role, 'EMPLOYEE_DELETE', 'employees', employeeId, JSON.stringify({ employeeName: employee.name })]
  )

  res.json({ ok:true, message:'Employee and associated data deleted successfully.' })
})

adminRouter.post('/attendance/upsert', async (req, res) => {
  const { employeeId, date, status, checkInTime, checkOutTime } = req.body || {}
  if(!employeeId || !date || !status) return res.status(400).json({ message:'employeeId, date, status required' })

  await exec(
    `INSERT INTO attendance (employee_id, date, status, check_in_time, check_out_time)
     VALUES (?,?,?,?,?)
     ON CONFLICT(employee_id, date) DO UPDATE SET
       status=excluded.status,
       check_in_time=excluded.check_in_time,
       check_out_time=excluded.check_out_time
    `,
    [Number(employeeId), date, status, checkInTime || null, checkOutTime || null]
  )

  await exec(
    `INSERT INTO audit_log (actor_user_id, actor_role, action_type, entity_type, entity_id, metadata_json)
     VALUES (?,?,?,?,?,?)`,
    [req.user.id, req.user.role, 'UPSERT_ATTENDANCE', 'attendance', Number(employeeId), JSON.stringify({ date, status, checkInTime, checkOutTime })]
  )

  res.json({ ok:true })
})

adminRouter.get('/attendance', async (req, res) => {
  const { employeeId, date } = req.query
  const params = []
  let sql = `SELECT a.id, a.employee_id, a.date, a.status, a.check_in_time, a.check_out_time, e.name AS employeeName
               FROM attendance a
               JOIN employees e ON e.id = a.employee_id
               WHERE 1=1`

  if(employeeId){
    sql += ` AND a.employee_id = ?`
    params.push(Number(employeeId))
  }
  if(date){
    sql += ` AND a.date = ?`
    params.push(String(date))
  }

  sql += ` ORDER BY a.date DESC, e.name ASC`
  const rows = await all(sql, params)
  res.json(rows)
})

adminRouter.get('/attendance/export', async (req, res) => {
  const { employeeId, date } = req.query

  let sql = `SELECT e.name AS employeeName, a.date, a.status, a.check_in_time AS checkInTime, a.check_out_time AS checkOutTime
             FROM attendance a JOIN employees e ON e.id=a.employee_id WHERE 1=1`
  const params = []
  if(employeeId){ sql += ` AND a.employee_id=?`; params.push(Number(employeeId)) }
  if(date){ sql += ` AND a.date=?`; params.push(String(date)) }
  sql += ` ORDER BY a.date DESC`

  const rows = await all(sql, params)

  const header = ['Employee Name','Date','Status','Check-in','Check-out']
  const csv = [header.join(',')]
  for(const r of rows){
    csv.push([
      r.employeeName,
      r.date,
      r.status,
      r.checkInTime || '',
      r.checkOutTime || ''
    ].map(x => `"${String(x).replaceAll('"','""')}"`).join(','))
  }

  res.setHeader('Content-Type','text/csv')
  res.setHeader('Content-Disposition','attachment; filename="attendance.csv"')
  res.send(csv.join('\n'))
})

adminRouter.get('/accounting/summary', async (req, res) => {
  const branch = await getActorBranch(req)
  const params = []
  let sql = `
    SELECT 
      p.period_start AS periodStart, 
      p.period_end AS periodEnd,
      SUM(p.net_pay) AS totalNetPay,
      SUM(p.deductions_amount) AS totalDeductions,
      SUM(p.net_pay + p.deductions_amount) AS totalGrossExpense,
      COUNT(p.id) AS headCount,
      p.status
    FROM payrolls p
  `

  if (branch) {
    sql += ` JOIN employees e ON p.employee_id = e.id WHERE e.branch = ?`
    params.push(branch)
  }

  sql += ` GROUP BY p.period_start, p.period_end, p.status
           ORDER BY p.period_start DESC`

  const rows = await all(sql, params)
  res.json(rows)
})

adminRouter.get('/hris/overview', async (req, res) => {
  const branchStats = await all(`
    SELECT branch, COUNT(*) as count 
    FROM employees 
    GROUP BY branch
  `)
  const positionStats = await all(`
    SELECT job_position as position, COUNT(*) as count 
    FROM employees 
    GROUP BY job_position
  `)
  const genderStats = await all(`
    SELECT gender, COUNT(*) as count 
    FROM employees 
    GROUP BY gender
  `)
  const statusStats = await all(`
    SELECT employment_status as status, COUNT(*) as count 
    FROM employees 
    GROUP BY employment_status
  `)

  const totals = await getOne(`
    SELECT 
      COUNT(*) as count, 
      AVG(base_salary_monthly) as avgSalary, 
      SUM(leave_credits) as totalCredits 
    FROM employees
  `)

  const recentEmployees = await all(`
    SELECT name, job_position as position, branch
    FROM employees 
    ORDER BY id DESC 
    LIMIT 5
  `)

  res.json({ branchStats, positionStats, summary: totals, recentEmployees })
})

adminRouter.get('/payroll', async (req, res) => {
  const { employeeId, periodStart, periodEnd } = req.query

  const where = [`1=1`]
  const params = []

  if(employeeId){ where.push(`employee_id=?`); params.push(Number(employeeId)) }
  if(periodStart){ where.push(`period_start>=?`); params.push(String(periodStart)) }
  if(periodEnd){ where.push(`period_end<=?`); params.push(String(periodEnd)) }

  const sql = `SELECT id,
                      employee_id AS employeeId,
                      period_start AS periodStart,
                      period_end AS periodEnd,
                      overtime_hours AS overtimeHours,
                      overtime_pay AS overtimePay,
                      deductions_amount AS deductionsAmount,
                      net_pay AS netPay,
                      status AS status,
                      approved_at AS approvedAt,
                      paid_at AS paidAt
               FROM payrolls
               WHERE ${where.join(' AND ')}
               ORDER BY period_start DESC`

  const rows = await all(sql, params)
  res.json(rows)
})

adminRouter.post('/payroll/:id/approve', async (req, res) => {
  const payrollId = Number(req.params.id)
  if(!payrollId) return res.status(400).json({ message:'Invalid payroll id' })

  const row = await getOne(`SELECT id, status, employee_id FROM payrolls WHERE id=?`, [payrollId])
  if(!row) return res.status(404).json({ message:'Payroll not found' })
  if(row.status !== 'Draft') return res.status(409).json({ message:'Payroll must be Draft to approve' })

  await exec(
    `UPDATE payrolls
     SET status='Approved', approved_at=CURRENT_TIMESTAMP, approved_by_admin_id=?
     WHERE id=?`,
    [req.user.id, payrollId]
  )

  await exec(
    `INSERT INTO audit_log (actor_user_id, actor_role, action_type, entity_type, entity_id, metadata_json)
     VALUES (?,?,?,?,?,?)`,
    [req.user.id, req.user.role, 'PAYROLL_APPROVE', 'payrolls', payrollId, JSON.stringify({ payrollId })]
  )

  res.json({ ok:true })
})

adminRouter.post('/payroll/:id/pay', async (req, res) => {
  const payrollId = Number(req.params.id)
  if(!payrollId) return res.status(400).json({ message:'Invalid payroll id' })

  const row = await getOne(`SELECT id, status FROM payrolls WHERE id=?`, [payrollId])
  if(!row) return res.status(404).json({ message:'Payroll not found' })
  if(row.status !== 'Approved') return res.status(409).json({ message:'Payroll must be Approved to pay' })

  await exec(
    `UPDATE payrolls
     SET status='Paid', paid_at=CURRENT_TIMESTAMP
     WHERE id=?`,
    [payrollId]
  )

  await exec(
    `INSERT INTO audit_log (actor_user_id, actor_role, action_type, entity_type, entity_id, metadata_json)
     VALUES (?,?,?,?,?,?)`,
    [req.user.id, req.user.role, 'PAYROLL_PAY', 'payrolls', payrollId, JSON.stringify({ payrollId })]
  )

  res.json({ ok:true })
})



adminRouter.post('/payroll/generate', async (req, res) => {
  const {
    employeeId,
    periodStart,
    periodDays,
    breakdown,
    sss, philhealth, pagibig, tardiness, shareCapital,
    ultimaA, alkansyaA, savingsReg, employeesFund, regularLoans,
    others, mealsAllowance
  } = req.body || {}

  if(!employeeId || !periodStart) return res.status(400).json({ message:'employeeId and periodStart required' })

  const days = Number(periodDays || 15)
  const periodEnd = addDays(periodStart, days - 1)

  const employee = await getOne(
    `SELECT id, base_salary_monthly AS baseSalaryMonthly, overtime_rate_per_hour AS overtimeRatePerHour, leave_credits AS leaveCredits FROM employees WHERE id=?`,
    [Number(employeeId)]
  )
  if(!employee) return res.status(404).json({ message:'Employee not found' })

  const attendanceRows = await all(
    `SELECT status, check_in_time, check_out_time
     FROM attendance
     WHERE employee_id=? AND date BETWEEN ? AND ?`,
    [Number(employeeId), periodStart, periodEnd]
  )

  // Automatic Absence & Leave Credit Logic
  const dailyRate = Number(employee.baseSalaryMonthly) / 30
  let autoAbsenceDeduction = 0
  let currentCredits = Number(employee.leaveCredits || 0)
  let creditsToDeduct = 0

  attendanceRows.forEach(att => {
    if (att.status === 'Absent') {
      if (currentCredits > 0) {
        currentCredits -= 1
        creditsToDeduct += 1
      } else {
        autoAbsenceDeduction += dailyRate
      }
    }
  })

  const overtimeHours = computeOvertimeHours(attendanceRows, 8)
  const overtimePay = overtimeHours * Number(employee.overtimeRatePerHour)

  const manualMeals = Number(mealsAllowance || 0)
  const grossPay = Number(employee.baseSalaryMonthly) + overtimePay + manualMeals

  const deductionsData = {
    sss: Number(sss || 0),
    philhealth: Number(philhealth || 0),
    pagibig: Number(pagibig || 0),
    tardiness: Number(tardiness || 0) + autoAbsenceDeduction,
    shareCapital: Number(shareCapital || 0),
    ultimaA: Number(ultimaA || 0),
    alkansyaA: Number(alkansyaA || 0),
    savingsReg: Number(savingsReg || 0),
    employeesFund: Number(employeesFund || 0),
    regularLoans: Number(regularLoans || 0),
    others: Number(others || 0)
  }

  const computed = computeStatutoryDeductions({ grossPay, breakdown: deductionsData })
  const totalDeductions = computed.totalDeductions

  const netPay = grossPay - totalDeductions

  await exec(
    `INSERT INTO payrolls (employee_id, period_start, period_end, overtime_hours, overtime_pay, deductions_amount, net_pay, status)
     VALUES (?,?,?,?,?,?,?, 'Draft')
     ON CONFLICT(employee_id, period_start, period_end) DO UPDATE SET
       overtime_hours=excluded.overtime_hours,
       overtime_pay=excluded.overtime_pay,
       deductions_amount=excluded.deductions_amount,
       net_pay=excluded.net_pay,
       status='Draft'
    `,
    [Number(employeeId), periodStart, periodEnd, overtimeHours, overtimePay, totalDeductions, netPay]
  )

  // Store detailed breakdown in audit log metadata so payslip can find it
  await exec(
    `INSERT INTO audit_log (actor_user_id, actor_role, action_type, entity_type, entity_id, metadata_json)
     VALUES (?,?,?,?,?,?)`,
    [
      req.user.id, req.user.role, 'PAYROLL_GENERATE', 'payrolls', null, 
      JSON.stringify({ 
        employeeId: Number(employeeId), 
        periodStart, 
        periodEnd,
        breakdown: { ...deductionsData, mealsAllowance: manualMeals }
      })
    ]
  )

  res.json({ ok:true, grossPay, totalDeductions, status:'Draft' })
})



adminRouter.get('/payroll/export', async (req, res) => {
  const { employeeId, periodStart } = req.query

  let sql = `SELECT e.name AS employeeName, p.period_start AS periodStart, p.period_end AS periodEnd,
                     p.overtime_hours AS overtimeHours, p.overtime_pay AS overtimePay,
                     p.deductions_amount AS deductionsAmount, p.net_pay AS netPay
              FROM payrolls p JOIN employees e ON e.id=p.employee_id WHERE 1=1`
  const params = []
  if(employeeId){ sql += ` AND p.employee_id=?`; params.push(Number(employeeId)) }
  if(periodStart){ sql += ` AND p.period_start=?`; params.push(String(periodStart)) }
  sql += ` ORDER BY p.period_start DESC`

  const rows = await all(sql, params)

  const header = ['Employee Name','Period Start','Period End','Overtime Hours','Overtime Pay','Deductions','Net Pay']
  const csv = [header.join(',')]
  for(const r of rows){
    csv.push([
      r.employeeName,
      r.periodStart,
      r.periodEnd,
      r.overtimeHours,
      r.overtimePay,
      r.deductionsAmount,
      r.netPay
    ].map(x => `"${String(x).replaceAll('"','""')}"`).join(','))
  }

  res.setHeader('Content-Type','text/csv')
  res.setHeader('Content-Disposition','attachment; filename="payroll.csv"')
  res.send(csv.join('\n'))
})

adminRouter.get('/payroll/:id/payslip', async (req, res) => {
  const payrollId = Number(req.params.id)
  if(!payrollId) return res.status(400).json({ message:'Invalid payroll id' })

  const row = await getOne(
    `SELECT p.id, p.employee_id AS employeeId, p.period_start AS periodStart, p.period_end AS periodEnd,
            p.overtime_hours AS overtimeHours, p.overtime_pay AS overtimePay,
            p.deductions_amount AS deductionsAmount, p.net_pay AS netPay,
            p.status AS status, p.approved_at AS approvedAt, p.paid_at AS paidAt,
            e.name AS employeeName, e.email AS employeeEmail,
            e.base_salary_monthly AS baseSalaryMonthly, e.overtime_rate_per_hour AS overtimeRatePerHour
     FROM payrolls p
     JOIN employees e ON e.id=p.employee_id
     WHERE p.id = ?`,
    [payrollId]
  )

  if(!row) return res.status(404).json({ message:'Payroll not found' })

  // Retrieve breakdown from the generation log
  const log = await getOne(
    `SELECT metadata_json FROM audit_log WHERE entity_type='payrolls' AND action_type='PAYROLL_GENERATE' 
     AND metadata_json LIKE ? ORDER BY created_at DESC LIMIT 1`,
    [`%\"employeeId\":${row.employeeId},\"periodStart\":\"${row.periodStart}\"%`]
  )
  const meta = log ? JSON.parse(log.metadata_json).breakdown : {}

  const ratePerDay = (Number(row.baseSalaryMonthly) / 30).toFixed(2);
  const baseAmount = (Number(row.baseSalaryMonthly) / 2).toFixed(2); // Assuming 15-day period
  const grossEarnings = (Number(baseAmount) + Number(row.overtimePay) + Number(meta.mealsAllowance || 0)).toFixed(2);
  const netPayWords = numberToWords(row.netPay);

  const csv = [
    ['San Jose Multi-Purpose Cooperative'],
    ['Trade Town Dalipe, San Jose Antique'],
    [''],
    ['Employee No', row.employeeId],
    ['Employee Name', row.employeeName],
    ['Payroll Date', new Date().toISOString().slice(0,10)],
    ['For the Period', `${row.periodStart} to ${row.periodEnd}`],
    [''],
    ['EARNINGS TITLE'],
    ['Rate Per day', ratePerDay],
    ['No of Days', '15'],
    ['Amount', baseAmount],
    ['Overtime', row.overtimePay],
    ['Meals Allowance', (meta.mealsAllowance || 0).toFixed(2)],
    [''],
    ['DEDUCTION TITLE'],
    ['SSS', (meta.sss || 0).toFixed(2)],
    ['Philhealth', (meta.philhealth || 0).toFixed(2)],
    ['Pagibig', (meta.pagibig || 0).toFixed(2)],
    ['Tardiness/Absent', (meta.tardiness || 0).toFixed(2)],
    ['Share Capital', (meta.shareCapital || 0).toFixed(2)],
    ['Ultima A', (meta.ultimaA || 0).toFixed(2)],
    ['Alkansya A', (meta.alkansyaA || 0).toFixed(2)],
    ['Savings Reg', (meta.savingsReg || 0).toFixed(2)],
    ['Employees Fund', (meta.employeesFund || 0).toFixed(2)],
    ['Regular Loans', (meta.regularLoans || 0).toFixed(2)],
    ['Others', (meta.others || 0).toFixed(2)],
    [''],
    ['Gross Earnings', grossEarnings],
    ['Gross Deductions', row.deductionsAmount],
    ['Net Pay', row.netPay],
    ['Net Pay in Words', netPayWords]
  ];

  const csvString = csv.map(row => 
    row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(',')
  ).join('\n');

  const filename = `payslip-${row.employeeName.replace(/\s+/g, '_')}-${row.periodStart}.csv`
  res.setHeader('Content-Type','text/csv')
  res.setHeader('Content-Disposition',`attachment; filename="${filename}"`)
  res.send(csvString)
})
