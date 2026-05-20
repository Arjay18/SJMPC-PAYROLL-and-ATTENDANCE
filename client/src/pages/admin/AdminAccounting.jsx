import React, { useEffect, useState } from 'react'
import { FiBookOpen, FiPieChart, FiTrendingUp, FiAlertCircle } from 'react-icons/fi'
import api from '../../auth/api.js'
import { formatCurrency, formatDate } from '../../lib/utils.js' // Corrected import path

export default function AdminAccounting() {
  const [summary, setSummary] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/accounting/summary')
      .then(res => setSummary(res.data))
      .catch(err => console.error("Accounting fetch error:", err))
      .finally(() => setLoading(false))
  }, [])

  const totalDisbursed = summary.reduce((acc, curr) => acc + (curr.status === 'Paid' ? curr.totalNetPay : 0), 0)
  const pendingLiabilities = summary.reduce((acc, curr) => acc + (curr.status !== 'Paid' ? curr.totalNetPay : 0), 0)

  return (
    <div className="container page-animate">
      <div className="mainHeader">
        <div className="pageTitle">
          <div className="h1">Accounting Summary</div>
          <div className="muted">Track total labor costs and statutory payables.</div>
        </div>
        <FiBookOpen className="muted" size={32} />
      </div>

      <div className="dashboardStats">
        <div className="statCard cardAccent1">
          <div className="statIcon"><FiTrendingUp /></div>
          <div>
            <div className="muted">Total Disbursed</div>
            <div className="statValue">{formatCurrency(totalDisbursed)}</div>
          </div>
        </div>
        <div className="statCard cardAccent3">
          <div className="statIcon"><FiAlertCircle /></div>
          <div>
            <div className="muted">Pending Net Pay</div>
            <div className="statValue">{formatCurrency(pendingLiabilities)}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="topbar">
          <div className="h1" style={{ fontSize: 18 }}>Payroll Cut-off Ledger</div>
          <FiPieChart className="muted" />
        </div>
        <div style={{ padding: 18, overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Employees</th>
                <th>Total Gross (Cost)</th>
                <th>Total Deductions</th>
                <th>Total Net Pay</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((row, idx) => (
                <tr key={idx}>
                  <td>{formatDate(row.periodStart)} to {formatDate(row.periodEnd)}</td>
                  <td>{row.headCount}</td>
                  <td>{formatCurrency(row.totalGrossExpense)}</td>
                  <td>{formatCurrency(row.totalDeductions)}</td>
                  <td><b>{formatCurrency(row.totalNetPay)}</b></td>
                  <td>
                    <span className={`badge ${row.status === 'Paid' ? 'success' : 'neutral'}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {summary.length === 0 && !loading && <div className="muted" style={{ padding: 20 }}>No accounting records found.</div>}
        </div>
      </div>
    </div>
  )
}