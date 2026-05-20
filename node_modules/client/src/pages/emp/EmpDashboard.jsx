import React, { useMemo } from 'react'
import { FiCalendar, FiDollarSign, FiStar, FiClock, FiInfo, FiActivity, FiBriefcase, FiEdit } from 'react-icons/fi'
import { useAuth } from '../../auth/useAuth.jsx'

export default function EmpDashboard() {
  const { user } = useAuth()
  
  const calendarDays = useMemo(() => {
    const date = new Date()
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    const days = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)
    return days
  }, [])

  const monthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div style={{ gridColumn: '1 / -1' }}>
        <div className="h1">Welcome, {user?.name?.split(' ')[0] || 'User'}!</div>
        <div className="muted">Here is your summary for today.</div>
      </div>

      <div className="dashboardStats" style={{ gridColumn: '1 / -1' }}>
        <div className="statCard cardAccent1">
          <div className="statIcon"><FiStar /></div>
          <div>
            <div className="muted">Leave Credits</div>
            <div className="statValue">{user?.leaveCredits || '15.0'}</div>
          </div>
        </div>
        <div className="statCard cardAccent2">
          <div className="statIcon"><FiDollarSign /></div>
          <div>
            <div className="muted">Base Salary</div>
            <div className="statValue">₱{Number(user?.baseSalaryMonthly || 0).toLocaleString()}</div>
          </div>
        </div>
        <div className="statCard cardAccent3">
          <div className="statIcon"><FiClock /></div>
          <div>
            <div className="muted">OT Rate</div>
            <div className="statValue">₱{Number(user?.overtimeRatePerHour || 0).toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiActivity className="primary" />
            <div style={{ fontWeight: 800 }}>Work-Life Balance</div>
          </div>
          <div className="muted" style={{ fontSize: 12 }}>{user?.leaveCredits || 15} / 15 days</div>
        </div>
        <div style={{ height: 10, background: 'var(--bg2)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ 
            height: '100%', 
            width: `${((user?.leaveCredits || 15) / 15) * 100}%`, 
            background: 'var(--primary)',
            borderRadius: 10,
            transition: 'width 1s ease'
          }} />
        </div>
        <div className="muted" style={{ fontSize: 11, marginTop: 10 }}>Your current remaining leave credit balance.</div>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <FiBriefcase className="primary" />
          <div style={{ fontWeight: 800 }}>My Job Description</div>
        </div>
        <div className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
          {user?.jobDescription || "Official job description has not been assigned yet. Please coordinate with your supervisor for a detailed list of duties."}
        </div>
      </div>

      <div className="calendar-container">
        <div className="calendar-header">
          <div className="h1" style={{ fontSize: 18 }}>{monthName}</div>
          <div className="badge success">Attendance Calendar</div>
        </div>
        <div className="calendar-grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="calendar-day-label">{d}</div>
          ))}
          {calendarDays.map((day, idx) => (
            <div 
              key={idx} 
              className={`calendar-day ${day === new Date().getDate() ? 'today' : ''}`}
            >
              {day}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="topbar">
          <div className="h1" style={{ fontSize: 18 }}>Announcements</div>
          <FiInfo className="muted" />
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ marginBottom: 18 }}>
            <div className="badge success" style={{ marginBottom: 8, fontSize: 10 }}>Company News</div>
            <div style={{ fontWeight: 700 }}>Annual General Assembly</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>Scheduled for this coming Saturday at the Main Branch hall. Attendance is encouraged.</div>
          </div>
          <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '18px 0' }} />
          <div>
            <div className="badge neutral" style={{ marginBottom: 8, fontSize: 10 }}>Policy Update</div>
            <div style={{ fontWeight: 700 }}>2024 Health Package</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>The new health benefit guidelines have been uploaded to the cooperative handbook.</div>
          </div>
        </div>
      </div>
    </div>
  )
}