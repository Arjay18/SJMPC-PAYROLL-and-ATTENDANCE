import React, { useEffect, useState } from 'react'
import api from '../../auth/api'

export default function EmpOvertimeRequest(){
  const [rows, setRows] = useState([])

  const [date, setDate] = useState('')
  const [checkInTime, setCheckInTime] = useState('')
  const [checkOutTime, setCheckOutTime] = useState('')
  const [message, setMessage] = useState(null)

  useEffect(()=>{
    api.get('/overtime/employee/my').then(res => setRows(res.data)).catch(()=>{})
  }, [])

  async function submit(e){
    e.preventDefault()
    setMessage(null)
    await api.post('/overtime/submit', { date, checkInTime, checkOutTime })
    const res = await api.get('/overtime/employee/my')
    setRows(res.data)
    setDate('')
    setCheckInTime('')
    setCheckOutTime('')
    setMessage({ type:'success', text:'Overtime request submitted (Pending).' })
  }

  return (
    <div className="card">
      <div className="topbar">
        <div>
          <div className="h1">Overtime Requests</div>
          <div className="muted" style={{ marginTop: 6 }}>Request overtime for admin approval</div>
        </div>
        <div className="badge neutral">Employee</div>
      </div>

      <div style={{ padding: 18 }}>
        <form onSubmit={submit} className="formRow">
          <div>
            <div className="muted" style={{ marginBottom: 8 }}>Date</div>
            <input className="input" type="date" value={date} onChange={(e)=>setDate(e.target.value)} required />
          </div>
          <div>
            <div className="muted" style={{ marginBottom: 8 }}>Start time</div>
            <input className="input" type="time" value={checkInTime} onChange={(e)=>setCheckInTime(e.target.value)} required />
          </div>
          <div>
            <div className="muted" style={{ marginBottom: 8 }}>End time</div>
            <input className="input" type="time" value={checkOutTime} onChange={(e)=>setCheckOutTime(e.target.value)} required />
          </div>

          <div style={{ gridColumn:'1 / -1', display:'flex', gap: 12, alignItems:'center' }}>
            <button className="btn primary" type="submit">Submit Overtime Request</button>
            {message ? <div className={message.type === 'success' ? 'badge success' : 'badge danger'}>{message.text}</div> : <div />}
          </div>
        </form>

        <div style={{ marginTop: 22 }}>
          <div className="muted" style={{ marginBottom: 8 }}>Requests</div>
          <div style={{ overflowX:'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Times</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id}>
                    <td>{r.date}</td>
                    <td>{r.checkInTime} → {r.checkOutTime}</td>
                    <td>
                      <span className={r.status === 'Approved' ? 'badge success' : r.status === 'Rejected' ? 'badge danger' : 'badge neutral'}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <div className="muted">No overtime requests yet.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

