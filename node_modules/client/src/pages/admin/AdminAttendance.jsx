import React, { useEffect, useMemo, useState } from 'react'
import { FiDownload, FiEdit, FiSave, FiClock } from 'react-icons/fi'
import api from '../../auth/api.js'

function computeLateMinutes(checkInTime) {
  if(!checkInTime) return null
  const [hours, minutes] = checkInTime.split(':').map(Number)
  const total = (hours * 60) + minutes
  const late = total - (9 * 60)
  return late > 0 ? late : 0
}

function formatLate(checkInTime) {
  const minutes = computeLateMinutes(checkInTime)
  if(minutes === null) return '-'
  if(minutes <= 0) return 'On time'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours ? `${hours}h ` : ''}${mins}m late`
}

export default function AdminAttendance(){
  const [employees, setEmployees] = useState([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [filterDate, setFilterDate] = useState('')
  const [date, setDate] = useState('')
  const [status, setStatus] = useState('Present')
  const [checkInTime, setCheckInTime] = useState('')
  const [checkOutTime, setCheckOutTime] = useState('')
  const [selectedRecordId, setSelectedRecordId] = useState(null)
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  const selectedEmployee = employees.find(emp => String(emp.id) === String(selectedEmployeeId))

  async function loadEmployees(){
    const res = await api.get('/admin/employees')
    setEmployees(res.data)
    if(res.data[0] && !selectedEmployeeId) setSelectedEmployeeId(String(res.data[0].id))
  }

  async function loadAttendance(){
    if(!selectedEmployeeId) return
    setLoading(true)
    try{
      const params = new URLSearchParams()
      params.set('employeeId', selectedEmployeeId)
      if(filterDate) params.set('date', filterDate)
      const res = await api.get(`/admin/attendance?${params.toString()}`)
      setAttendanceRecords(res.data)
    }finally{
      setLoading(false)
    }
  }

  useEffect(() => { loadEmployees().catch(()=>{}) }, [])
  useEffect(() => { if(selectedEmployeeId) loadAttendance().catch(()=>{}) }, [selectedEmployeeId, filterDate])

  const stats = useMemo(() => {
    const presentCount = attendanceRecords.filter(r => r.status === 'Present').length
    const leaveCount = attendanceRecords.filter(r => r.status === 'Leave').length
    const absentCount = attendanceRecords.filter(r => r.status === 'Absent').length
    const lateCount = attendanceRecords.filter(r => computeLateMinutes(r.check_in_time) > 0).length
    return { presentCount, leaveCount, absentCount, lateCount }
  }, [attendanceRecords])

  async function saveAttendance(e){
    e.preventDefault()
    setMessage(null)
    const payload = {
      employeeId: Number(selectedEmployeeId),
      date,
      status,
      checkInTime: status === 'Present' ? checkInTime : null,
      checkOutTime: status === 'Present' ? checkOutTime : null,
    }
    await api.post('/admin/attendance/upsert', payload)
    setMessage({ type: 'success', text: 'Attendance record saved.' })
    await loadAttendance()
    setSelectedRecordId(null)
  }

  function startEdit(record){
    setSelectedRecordId(record.id)
    setSelectedEmployeeId(String(record.employee_id))
    setDate(record.date)
    setStatus(record.status)
    setCheckInTime(record.check_in_time || '')
    setCheckOutTime(record.check_out_time || '')
    setMessage(null)
  }

  function clearForm(){
    setSelectedRecordId(null)
    setDate('')
    setStatus('Present')
    setCheckInTime('')
    setCheckOutTime('')
    setMessage(null)
  }

  async function exportCsv(){
    const params = new URLSearchParams()
    if(selectedEmployeeId) params.set('employeeId', selectedEmployeeId)
    if(filterDate) params.set('date', filterDate)
    const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/admin/attendance/export?${params.toString()}`
    window.location.href = url
  }

  return (
    <div className="card">
      <div className="topbar">
        <div>
          <div className="h1">Attendance</div>
          <div className="muted" style={{ marginTop: 6 }}>View, override and update employee times.</div>
        </div>
        <div style={{ display:'flex', gap: 10, flexWrap:'wrap', alignItems:'center' }}>
          <button className="btn" type="button" onClick={exportCsv}><FiDownload /> Export CSV</button>
        </div>
      </div>

      <div style={{ padding: 24 }}>
        <div className="dashboardStats" style={{ marginBottom: 22 }}>
          <div className="statCard cardAccent1">
            <div className="statIcon"><FiClock /></div>
            <div>
              <div className="muted">Present</div>
              <div className="statValue">{stats.presentCount}</div>
            </div>
          </div>
          <div className="statCard cardAccent2">
            <div className="statIcon"><FiClock /></div>
            <div>
              <div className="muted">Leave</div>
              <div className="statValue">{stats.leaveCount}</div>
            </div>
          </div>
          <div className="statCard cardAccent3">
            <div className="statIcon"><FiClock /></div>
            <div>
              <div className="muted">Absent</div>
              <div className="statValue">{stats.absentCount}</div>
            </div>
          </div>
          <div className="statCard cardAccent4">
            <div className="statIcon"><FiClock /></div>
            <div>
              <div className="muted">Late today</div>
              <div className="statValue">{stats.lateCount}</div>
            </div>
          </div>
          <div className="statCard cardAccent4">
            <div className="statIcon"><FiClock /></div>
            <div>
              <div className="muted">Selected</div>
              <div className="statValue">{selectedEmployee?.name || '-'}</div>
            </div>
          </div>
        </div>

        <div className="grid" style={{ gap: 20 }}>
          <div className="card sectionCard">
            <div className="topbar" style={{ marginBottom: 0 }}>
              <div>
                <div className="h1" style={{ fontSize: 18 }}>Attendance Override</div>
                <div className="muted subtleText">Admins can override punch-in and punch-out times for employees.</div>
              </div>
              <div className="badge success">Admin only</div>
            </div>
            <form onSubmit={saveAttendance} style={{ padding: 24, display:'grid', gap: 16 }}>
              <div className="formRow" style={{ margin: 0 }}>
                <div>
                  <div className="muted" style={{ marginBottom: 8 }}>Employee</div>
                  <select className="input" value={selectedEmployeeId} onChange={(e)=>setSelectedEmployeeId(e.target.value)} required>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="muted" style={{ marginBottom: 8 }}>Date</div>
                  <input className="input" type="date" value={date} onChange={(e)=>setDate(e.target.value)} required />
                </div>
              </div>

              <div className="formRow" style={{ margin: 0 }}>
                <div>
                  <div className="muted" style={{ marginBottom: 8 }}>Status</div>
                  <select className="input" value={status} onChange={(e)=>setStatus(e.target.value)}>
                    <option value="Present">Present</option>
                    <option value="Leave">Leave</option>
                    <option value="Absent">Absent</option>
                  </select>
                </div>
                <div>
                  <div className="muted" style={{ marginBottom: 8 }}>Check-in</div>
                  <input className="input" type="time" value={checkInTime} onChange={(e)=>setCheckInTime(e.target.value)} disabled={status !== 'Present'} />
                </div>
                <div>
                  <div className="muted" style={{ marginBottom: 8 }}>Check-out</div>
                  <input className="input" type="time" value={checkOutTime} onChange={(e)=>setCheckOutTime(e.target.value)} disabled={status !== 'Present'} />
                </div>
              </div>

              <div style={{ display:'flex', gap: 12, flexWrap:'wrap', alignItems:'center' }}>
                <button className="btn primary" type="submit"><FiSave /> Save override</button>
                <button className="btn" type="button" onClick={clearForm}>Clear</button>
                {message ? <div className={message.type === 'success' ? 'badge success' : 'badge danger'}>{message.text}</div> : null}
              </div>
            </form>
          </div>

          <div className="card sectionCard">
            <div className="topbar" style={{ marginBottom: 0 }}>
              <div>
                <div className="h1" style={{ fontSize: 18 }}>Attendance Time Log</div>
                <div className="muted subtleText">Review the selected employee's date, time in, and time out history.</div>
              </div>
              <div className="badge neutral">{attendanceRecords.length} records</div>
            </div>
            <div style={{ padding: 24 }}>
              <div className="formRow" style={{ margin: 0 }}>
                <div>
                  <div className="muted" style={{ marginBottom: 8 }}>Filter date</div>
                  <input className="input" type="date" value={filterDate} onChange={(e)=>setFilterDate(e.target.value)} />
                </div>
                <div style={{ display:'flex', alignItems:'end', gap: 12 }}>
                  <button className="btn" type="button" onClick={loadAttendance} disabled={loading}>Refresh</button>
                </div>
              </div>
              {selectedEmployee ? (
                <div className="muted" style={{ marginTop: 16, marginBottom: 8 }}>
                  Showing attendance for <strong>{selectedEmployee.name}</strong>
                </div>
              ) : null}
              <div style={{ overflowX:'auto', marginTop: 12 }}>
                <table className="table" style={{ minWidth: 760 }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time In</th>
                      <th>Time Out</th>
                      <th>Status</th>
                      <th>Late</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceRecords.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="muted">No attendance records found.</td>
                      </tr>
                    ) : attendanceRecords.map(record => (
                      <tr key={record.id}>
                        <td>{record.date}</td>
                        <td>{record.check_in_time || '-'}</td>
                        <td>{record.check_out_time || '-'}</td>
                        <td>{record.status}</td>
                        <td>{formatLate(record.check_in_time)}</td>
                        <td>
                          <button className="btn" type="button" onClick={() => startEdit(record)}><FiEdit /> Edit</button>
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
