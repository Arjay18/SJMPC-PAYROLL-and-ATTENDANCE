import React, { useEffect, useState } from 'react'
import { FiDownload } from 'react-icons/fi'
import api from '../../auth/api.js'
import { formatCurrency, formatDate } from '../../lib/utils.js' // Corrected import path

export default function EmpPayroll(){
  const [rows, setRows] = useState([])

  useEffect(() => {
    api.get('/employee/payroll').then(res => setRows(res.data)).catch(()=>{})
  }, [])

  function downloadPayslip(payrollId) {
    const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/employee/payroll/${payrollId}/payslip`
    window.open(url, '_blank')
  }

  return (
    <div className="card">
      <div className="topbar">
        <div>
          <div className="h1">My Payroll</div>
          <div className="muted" style={{ marginTop: 6 }}>Net pay history</div>
        </div>
        <div className="badge neutral">{rows.length} payrolls</div>
      </div>
      <div style={{ padding: 18, overflowX:'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Overtime Hours</th>
              <th>Overtime Pay</th>
              <th>Deductions</th>
              <th>Net Pay</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td>{formatDate(r.periodStart)} → {formatDate(r.periodEnd)}</td>
                <td>{r.overtimeHours}</td>
                <td>{formatCurrency(r.overtimePay)}</td>
                <td>{formatCurrency(r.deductionsAmount)}</td>
                <td><b>{formatCurrency(r.netPay)}</b></td>
                <td>
                  <button className="btn" type="button" onClick={() => downloadPayslip(r.id)}>
                    <FiDownload /> Payslip
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div className="muted">No payroll yet.</div>}
      </div>
    </div>
  )
}
