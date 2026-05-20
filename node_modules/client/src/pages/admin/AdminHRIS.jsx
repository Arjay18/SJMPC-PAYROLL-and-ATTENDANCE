import React, { useEffect, useState } from 'react'
import { FiAward, FiMapPin, FiBriefcase, FiTrendingUp, FiHeart, FiUsers, FiClock, FiPieChart } from 'react-icons/fi'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import api from '../../auth/api.js'
import { formatCurrency } from '../../lib/utils.js'

export default function AdminHRIS() {
  const [data, setData] = useState({ branchStats: [], positionStats: [], genderStats: [], statusStats: [], summary: {}, recentEmployees: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/hris/overview')
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  // Palette: Vibrant Green, Vibrant Blue, Yellow, Red (for Resigned/Danger)
  const COLORS = ['#00df81', '#0070ff', '#facc15', '#FF4D6D']

  return (
    <div className="container page-animate">
      <div className="mainHeader">
        <div className="pageTitle">
          <div className="h1">HRIS Management</div>
          <div className="muted">Organizational structure and human resource metrics.</div>
        </div>
        <FiAward className="muted" size={32} />
      </div>

      <div className="dashboardStats" style={{ marginBottom: 24 }}>
        <div className="statCard cardAccent1">
          <div className="statIcon"><FiUsers /></div>
          <div>
            <div className="muted">Total Workforce</div>
            <div className="statValue">{data.summary.count || 0}</div>
          </div>
        </div>
        <div className="statCard cardAccent2">
          <div className="statIcon"><FiTrendingUp /></div>
          <div>
            <div className="muted">Avg. Monthly Pay</div>
            <div className="statValue">{formatCurrency(data.summary.avgSalary || 0)}</div>
          </div>
        </div>
        <div className="statCard cardAccent3">
          <div className="statIcon"><FiHeart /></div>
          <div>
            <div className="muted">Co-op Leave Pool</div>
            <div className="statValue">{data.summary.totalCredits || 0} Days</div>
          </div>
        </div>
      </div>

      <div className="grid" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FiPieChart className="muted" />
              <div className="h1" style={{ fontSize: 18 }}>Gender Distribution</div>
            </div>
          </div>
          <div style={{ height: 300, padding: '10px 20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.genderStats} dataKey="count" nameKey="gender" cx="50%" cy="50%" outerRadius={80} label>
                  {data.genderStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FiPieChart className="muted" />
              <div className="h1" style={{ fontSize: 18 }}>Employment Status</div>
            </div>
          </div>
          <div style={{ height: 300, padding: '10px 20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.statusStats} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label>
                  {data.statusStats.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.status === 'Resigned' ? '#FF4D6D' : COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FiMapPin className="muted" />
              <div className="h1" style={{ fontSize: 18 }}>Branch Distribution</div>
            </div>
          </div>
          <div style={{ padding: 24 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Branch</th>
                  <th>Employee Count</th>
                </tr>
              </thead>
              <tbody>
                {data.branchStats.map((s, i) => (
                  <tr key={i}>
                    <td>{s.branch || 'Unassigned'}</td>
                    <td>{s.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.branchStats.length === 0 && !loading && <div className="muted" style={{ padding: 20 }}>No branch data available.</div>}
          </div>
        </div>

        <div className="card">
          <div className="topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FiBriefcase className="muted" />
              <div className="h1" style={{ fontSize: 18 }}>Position Breakdown</div>
            </div>
          </div>
          <div style={{ padding: 24 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Employee Count</th>
                </tr>
              </thead>
              <tbody>
                {data.positionStats.map((s, i) => (
                  <tr key={i}>
                    <td>{s.position || 'Unassigned'}</td>
                    <td>{s.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.positionStats.length === 0 && !loading && <div className="muted" style={{ padding: 20 }}>No position data available.</div>}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiClock className="muted" />
            <div className="h1" style={{ fontSize: 18 }}>Recent Hires</div>
          </div>
          <div className="badge neutral">New Members</div>
        </div>
        <div style={{ padding: 24, overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Job Position</th>
                <th>Branch</th>
              </tr>
            </thead>
            <tbody>
              {data.recentEmployees.map((emp, i) => (
                <tr key={i}>
                  <td>{emp.name}</td>
                  <td>{emp.position}</td>
                  <td>{emp.branch}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.recentEmployees.length === 0 && !loading && (
            <div className="muted" style={{ padding: 20 }}>No recently added employees.</div>
          )}
        </div>
      </div>
    </div>
  )
}