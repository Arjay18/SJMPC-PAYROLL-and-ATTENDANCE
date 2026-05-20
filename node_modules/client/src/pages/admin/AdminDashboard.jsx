import React, { useEffect, useState } from 'react'
import { FiUsers, FiCalendar, FiDollarSign, FiClock, FiClipboard } from 'react-icons/fi'
import api from '../../auth/api.js'

export default function AdminDashboard(){
  const [stats, setStats] = useState(null)
  const [employees, setEmployees] = useState([])

  useEffect(() => {
    api.get('/admin/stats').then(res => setStats(res.data)).catch(()=>{})
    api.get('/admin/employees').then(res => setEmployees(res.data.slice(0, 5))).catch(()=>{})
  }, [])

  return (
    <div>
      <div className="mainHeader">
        <div className="pageTitle">
          <div className="h1">Admin Dashboard</div>
          <div className="muted subtleText">A modern overview of payroll, attendance, and team activity.</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn primary" type="button">Generate payroll</button>
          <button className="btn" type="button">Add employee</button>
        </div>
      </div>

      <div className="dashboardStats">
        <div className="statCard cardAccent1">
          <div className="statIcon"><FiUsers /></div>
          <div>
            <div className="muted">Team Size</div>
            <div className="statValue">{stats?.employees ?? '–'}</div>
          </div>
        </div>
        <div className="statCard cardAccent2">
          <div className="statIcon"><FiCalendar /></div>
          <div>
            <div className="muted">Attendance Records</div>
            <div className="statValue">{stats?.attendanceRecords ?? '–'}</div>
          </div>
        </div>
        <div className="statCard cardAccent3">
          <div className="statIcon"><FiDollarSign /></div>
          <div>
            <div className="muted">Payroll Entries</div>
            <div className="statValue">{stats?.payrolls ?? '–'}</div>
          </div>
        </div>
        <div className="statCard cardAccent4">
          <div className="statIcon"><FiClock /></div>
          <div>
            <div className="muted">Last Payroll</div>
            <div className="statValue">{stats?.lastPayrollGeneratedAt || 'Not generated'}</div>
          </div>
        </div>
      </div>

      <div className="grid" style={{ gap: 20, marginTop: 24 }}>
        <div className="card sectionCard">
          <div className="topbar" style={{ marginBottom: 0 }}>
            <div>
              <div className="h1" style={{ fontSize: 18 }}>Quick Actions</div>
              <div className="muted subtleText">Launch common admin workflows fast.</div>
            </div>
            <div className="badge success">Fast access</div>
          </div>
          <div className="actionGrid">
            <button className="actionCard" type="button">
              <FiUsers />
              <div>
                <div style={{ fontWeight: 700 }}>Invite new employee</div>
                <div className="muted subtleText">Create profile and login</div>
              </div>
            </button>
            <button className="actionCard" type="button">
              <FiCalendar />
              <div>
                <div style={{ fontWeight: 700 }}>Review attendance</div>
                <div className="muted subtleText">Check daily records</div>
              </div>
            </button>
            <button className="actionCard" type="button">
              <FiDollarSign />
              <div>
                <div style={{ fontWeight: 700 }}>Run payroll</div>
                <div className="muted subtleText">Create salary batches</div>
              </div>
            </button>
            <button className="actionCard" type="button">
              <FiClipboard />
              <div>
                <div style={{ fontWeight: 700 }}>Travel requests</div>
                <div className="muted subtleText">Approve or reject orders</div>
              </div>
            </button>
          </div>
        </div>

        <div className="card sectionCard">
          <div className="topbar" style={{ marginBottom: 0 }}>
            <div>
              <div className="h1" style={{ fontSize: 18 }}>Recent Employees</div>
              <div className="muted subtleText">Latest team members added to the system.</div>
            </div>
            <div className="badge neutral">{employees.length} shown</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ minWidth: 560 }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Base Salary</th>
                  <th>OT Rate</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="muted">No recent employees yet.</td>
                  </tr>
                ) : employees.map(emp => (
                  <tr key={emp.id}>
                    <td>{emp.name}</td>
                    <td>{emp.email}</td>
                    <td>{Number(emp.baseSalaryMonthly).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</td>
                    <td>{Number(emp.overtimeRatePerHour).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
