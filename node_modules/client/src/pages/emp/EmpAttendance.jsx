import React, { useEffect, useState } from 'react'
import api from '../../auth/api.js'










export default function EmpAttendance(){
  const [rows, setRows] = useState([])

  useEffect(() => {
    api.get('/employee/attendance').then(res => setRows(res.data)).catch(()=>{})
  }, [])

  return (
    <div className="card">
      <div className="topbar">
        <div>
          <div className="h1">My Attendance</div>
          <div className="muted" style={{ marginTop: 6 }}>Check-in/out entries</div>
        </div>
        <div className="badge neutral">{rows.length} records</div>
      </div>
      <div style={{ padding: 18, overflowX:'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Status</th>
              <th>Check-in</th>
              <th>Check-out</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={`${r.id}`}> 
                <td>{r.date}</td>
                <td>
                  <span className={r.status === 'Present' ? 'badge success' : 'badge danger'}>{r.status}</span>
                </td>
                <td>{r.checkInTime || '-'}</td>
                <td>{r.checkOutTime || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div className="muted">No attendance records.</div>}
      </div>
    </div>
  )
}

