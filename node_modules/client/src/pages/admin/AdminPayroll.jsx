﻿import React, { useEffect, useMemo, useState } from 'react'
import { FiSearch, FiDownload, FiEdit, FiSave, FiClock } from 'react-icons/fi'
import api from '../../auth/api.js'
import { formatCurrency, formatDate } from '../../lib/utils.js' // Corrected import path

function addDaysToDate(dateStr, days) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days - 1)
  return date.toISOString().slice(0, 10)
}

export default function AdminPayroll() {
  const [employees, setEmployees] = useState([])
  const [employeeId, setEmployeeId] = useState('all')
  const [periodStart, setPeriodStart] = useState('')
  const [periodDays, setPeriodDays] = useState(15)
  
  // State for the full deduction breakdown
  const [sss, setSss] = useState(0)
  const [philhealth, setPhilhealth] = useState(0)
  const [pagibig, setPagibig] = useState(0)
  const [shareCapital, setShareCapital] = useState(0)
  const [loans, setLoans] = useState(0)
  const [others, setOthers] = useState(0)
  const [meals, setMeals] = useState(0)
  const [tardiness, setTardiness] = useState(0)

  const [historyStart, setHistoryStart] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [payrolls, setPayrolls] = useState([])
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  const selectedEmployee = employees.find(emp => String(emp.id) === String(employeeId))
  const periodEnd = addDaysToDate(periodStart, periodDays)

  useEffect(() => {
    api.get('/admin/employees').then(res => {
      setEmployees(res.data)
      if (!employeeId) setEmployeeId('all')
    }).catch(() => {})
  }, [])

  async function loadPayrolls() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (employeeId !== 'all') params.set('employeeId', employeeId)
      if (historyStart) params.set('periodStart', historyStart)
      const res = await api.get(`/admin/payroll?${params.toString()}`)
      setPayrolls(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPayrolls().catch(() => {})
  }, [employeeId, historyStart])

  const filteredPayrolls = useMemo(() => {
    return payrolls.filter(p => {
      if (!statusFilter) return true
      return String(p.status).toLowerCase() === String(statusFilter).toLowerCase()
    })
  }, [payrolls, statusFilter])

  const stats = useMemo(() => {
    const draft = payrolls.filter(p => p.status === 'Draft').length
    const approved = payrolls.filter(p => p.status === 'Approved').length
    const paid = payrolls.filter(p => p.status === 'Paid').length
    const totalNetPay = payrolls.reduce((sum, p) => sum + Number(p.netPay || 0), 0)
    return { total: payrolls.length, draft, approved, paid, totalNetPay }
  }, [payrolls])

  async function generate() {
    if (employeeId === 'all') {
      setMessage({ type: 'danger', text: 'Choose a specific employee before generating payroll.' })
      return
    }
    if (!periodStart) {
      setMessage({ type: 'danger', text: 'Select a payroll period start date.' })
      return
    }

    setMessage(null)
    const payload = {
      employeeId: Number(employeeId),
      periodStart,
      periodDays,
      sss: Number(sss),
      philhealth: Number(philhealth),
      pagibig: Number(pagibig),
      shareCapital: Number(shareCapital),
      regularLoans: Number(loans),
      others: Number(others),
      mealsAllowance: Number(meals),
      tardiness: Number(tardiness)
    }
    await api.post('/admin/payroll/generate', payload)
    setMessage({ type: 'success', text: 'Payroll generated successfully.' })
    await loadPayrolls()
  }

  async function approve(payrollId) {
    setMessage(null)
    await api.post(`/admin/payroll/${payrollId}/approve`)
    setMessage({ type: 'success', text: 'Payroll approved.' })
    await loadPayrolls()
  }

  async function pay(payrollId) {
    setMessage(null)
    await api.post(`/admin/payroll/${payrollId}/pay`)
    setMessage({ type: 'success', text: 'Payroll marked as paid.' })
    await loadPayrolls()
  }

  async function exportPayroll() {
    const params = new URLSearchParams()
    if (employeeId !== 'all') params.set('employeeId', employeeId)
    if (historyStart) params.set('periodStart', historyStart)
    const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/admin/payroll/export?${params.toString()}`
    window.location.href = url
  }

  function exportAll() {
    const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/admin/payroll/export`
    window.location.href = url
  }

  function downloadPayslip(payrollId) {
    const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/admin/payroll/${payrollId}/payslip`
    window.open(url, '_blank')
  }

  return (
    <div className="card">
      <div className="topbar">
        <div>
          <div className="h1">Payroll</div>
          <div className="muted" style={{ marginTop: 6 }}>Modern payroll generation, approval, and review in one place.</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn" type="button" onClick={exportPayroll}><FiDownload /> Export current</button>
          <button className="btn" type="button" onClick={exportAll}>Export all</button>
        </div>
      </div>

      <div style={{ padding: 24 }}>
        <div className="dashboardStats" style={{ marginBottom: 22 }}>
          <div className="statCard cardAccent1">
            <div className="statIcon"><FiClock /></div>
            <div>
              <div className="muted">Total payrolls</div>
              <div className="statValue">{stats.total}</div>
            </div>
          </div>
          <div className="statCard cardAccent2">
            <div className="statIcon"><FiClock /></div>
            <div>
              <div className="muted">Draft</div>
              <div className="statValue">{stats.draft}</div>
            </div>
          </div>
          <div className="statCard cardAccent3">
            <div className="statIcon"><FiClock /></div>
            <div>
              <div className="muted">Approved</div>
              <div className="statValue">{stats.approved}</div>
            </div>
          </div>
          <div className="statCard cardAccent4">
            <div className="statIcon"><FiClock /></div>
            <div>
              <div className="muted">Paid</div>
              <div className="statValue">{stats.paid}</div>
            </div>
          </div>
        </div>

        <div className="grid" style={{ gap: 20 }}>
          <div className="card sectionCard">
            <div className="topbar" style={{ marginBottom: 0 }}>
              <div>
                <div className="h1" style={{ fontSize: 18 }}>Generate payroll</div>
                <div className="muted subtleText">Create payroll for an employee with optional deductions.</div>
              </div>
              <div className="badge neutral">Preview</div>
            </div>

            <div style={{ padding: 24, display: 'grid', gap: 18 }}>
              <div className="formRow" style={{ margin: 0 }}>
                <div>
                  <div className="muted" style={{ marginBottom: 8 }}>Employee</div>
                  <select className="input" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
                    <option value="all">All employees</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="muted" style={{ marginBottom: 8 }}>Period start</div>
                  <input className="input" type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
                </div>
              </div>

              <div className="formRow" style={{ margin: 0 }}>
                <div>
                  <div className="muted" style={{ marginBottom: 8 }}>Period length</div>
                  <select className="input" value={periodDays} onChange={(e) => setPeriodDays(Number(e.target.value))}>
                    <option value={15}>15 days</option>
                    <option value={30}>30 days</option>
                  </select>
                </div>
                <div>
                  <div className="muted" style={{ marginBottom: 8 }}>Meals Allowance</div>
                  <input className="input" type="number" value={meals} onChange={(e) => setMeals(e.target.value)} />
                </div>
              </div>

              <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div><label className="muted">SSS</label><input className="input" type="number" value={sss} onChange={e => setSss(e.target.value)} /></div>
                <div><label className="muted">PhilHealth</label><input className="input" type="number" value={philhealth} onChange={e => setPhilhealth(e.target.value)} /></div>
                <div><label className="muted">Pag-IBIG</label><input className="input" type="number" value={pagibig} onChange={e => setPagibig(e.target.value)} /></div>
                <div><label className="muted">Tardiness</label><input className="input" type="number" value={tardiness} onChange={e => setTardiness(e.target.value)} /></div>
                <div><label className="muted">Share Cap</label><input className="input" type="number" value={shareCapital} onChange={e => setShareCapital(e.target.value)} /></div>
                <div><label className="muted">Loans</label><input className="input" type="number" value={loans} onChange={e => setLoans(e.target.value)} /></div>
                <div style={{ gridColumn: 'span 3' }}>
                   <label className="muted">Other Deductions</label>
                   <input className="input" type="number" value={others} onChange={e => setOthers(e.target.value)} />
                </div>
              </div>

              <div className="card" style={{ background: 'rgba(0,0,0,.03)', padding: 18 }}>
                <div className="muted" style={{ marginBottom: 10 }}>Payroll preview</div>
                <div className="formRow" style={{ margin: 0 }}>
                  <div>
                    <div className="muted">Period</div>
                    <div>{periodStart ? `${formatDate(periodStart)} → ${formatDate(periodEnd)}` : '-'}</div>
                  </div>
                  <div>
                    <div className="muted">Employee</div>
                    <div>{selectedEmployee ? selectedEmployee.name : 'All employees'}</div>
                  </div>
                </div>
                <div className="formRow" style={{ margin: 0, marginTop: 14 }}>
                  <div>
                    <div className="muted">Base salary</div>
                    <div>{selectedEmployee ? formatCurrency(selectedEmployee.baseSalaryMonthly) : '-'}</div>
                  </div>
                  <div>
                    <div className="muted">OT rate</div>
                    <div>{selectedEmployee ? `${formatCurrency(selectedEmployee.overtimeRatePerHour)}/hr` : '-'}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <button className="btn primary" type="button" onClick={generate} disabled={employeeId === 'all' || !periodStart}><FiSave /> Generate</button>
                <button className="btn" type="button" onClick={() => setMessage(null)}>Clear</button>
                {message ? <div className={message.type === 'success' ? 'badge success' : 'badge danger'}>{message.text}</div> : null}
              </div>
            </div>
          </div>

          <div className="card sectionCard">
            <div className="topbar" style={{ marginBottom: 0 }}>
              <div>
                <div className="h1" style={{ fontSize: 18 }}>Payroll history</div>
                <div className="muted subtleText">Filter records by status and period start date.</div>
              </div>
              <div className="badge neutral">{filteredPayrolls.length} entries</div>
            </div>

            <div style={{ padding: 24, display: 'grid', gap: 18 }}>
              <div className="formRow" style={{ margin: 0 }}>
                <div>
                  <div className="muted" style={{ marginBottom: 8 }}>Status</div>
                  <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">All statuses</option>
                    <option value="Draft">Draft</option>
                    <option value="Approved">Approved</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
                <div>
                  <div className="muted" style={{ marginBottom: 8 }}>History period start</div>
                  <input className="input" type="date" value={historyStart} onChange={(e) => setHistoryStart(e.target.value)} />
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Period</th>
                      <th>Status</th>
                      <th>OT hrs</th>
                      <th>OT pay</th>
                      <th>Deductions</th>
                      <th>Net pay</th>
                      <th>Approved / Paid</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayrolls.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="muted">No payroll records found.</td>
                      </tr>
                    ) : filteredPayrolls.map(p => (
                      <tr key={p.id}>
                        <td>{employees.find(emp => String(emp.id) === String(p.employeeId))?.name || 'Employee'}</td>
                        <td>{formatDate(p.periodStart)} → {formatDate(p.periodEnd)}</td>
                        <td>
                          <span className={`badge ${p.status === 'Approved' || p.status === 'Paid' ? 'success' : 'neutral'}`}>{p.status}</span>
                        </td>
                        <td>{p.overtimeHours}</td>
                        <td>{formatCurrency(p.overtimePay)}</td>
                        <td>{formatCurrency(p.deductionsAmount)}</td>
                        <td><strong>{formatCurrency(p.netPay)}</strong></td>
                        <td>{p.paidAt ? formatDate(p.paidAt) : p.approvedAt ? formatDate(p.approvedAt) : '-'}</td>
                        <td>
                          <div style={{ display: 'grid', gap: 8 }}>
                            {p.status === 'Draft' ? (
                              <button className="btn primary" type="button" onClick={() => approve(p.id)}>Approve</button>
                            ) : p.status === 'Approved' ? (
                              <button className="btn primary" type="button" onClick={() => pay(p.id)}>Mark Paid</button>
                            ) : (
                              <span className="muted">Completed</span>
                            )}
                            <button className="btn" type="button" onClick={() => downloadPayslip(p.id)}><FiDownload /> Payslip</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
