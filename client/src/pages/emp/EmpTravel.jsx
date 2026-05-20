import React, { useEffect, useState } from 'react'
import api from '../../auth/api'

export default function EmpTravel(){
  const [rows, setRows] = useState([])

  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [totalCost, setTotalCost] = useState(0)

  const [message, setMessage] = useState(null)

  useEffect(()=>{
    api.get('/travel/employee/my').then(res => setRows(res.data)).catch(()=>{})
  }, [])

  async function submit(e){
    e.preventDefault()
    setMessage(null)
    await api.post('/travel/submit', {
      destination,
      startDate,
      endDate,
      reason,
      totalCost: Number(totalCost)
    })
    setDestination('')
    setStartDate('')
    setEndDate('')
    setReason('')
    setTotalCost(0)
    const res = await api.get('/travel/employee/my')
    setRows(res.data)
    setMessage({ type:'success', text:'Travel order submitted (Pending).' })
  }

  return (
    <div className="card">
      <div className="topbar">
        <div>
          <div className="h1">Travel Orders</div>
          <div className="muted" style={{ marginTop: 6 }}>Submit request for admin approval</div>
        </div>
        <div className="badge neutral">Employee</div>
      </div>

      <div style={{ padding: 18 }}>
        <form onSubmit={submit} className="formRow">
          <div>
            <div className="muted" style={{ marginBottom: 8 }}>Destination</div>
            <input className="input" value={destination} onChange={(e)=>setDestination(e.target.value)} required />
          </div>
          <div>
            <div className="muted" style={{ marginBottom: 8 }}>Total Cost</div>
            <input className="input" type="number" value={totalCost} onChange={(e)=>setTotalCost(e.target.value)} required />
          </div>

          <div>
            <div className="muted" style={{ marginBottom: 8 }}>Start Date</div>
            <input className="input" type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)} required />
          </div>
          <div>
            <div className="muted" style={{ marginBottom: 8 }}>End Date</div>
            <input className="input" type="date" value={endDate} onChange={(e)=>setEndDate(e.target.value)} required />
          </div>

          <div style={{ gridColumn:'1 / -1' }}>
            <div className="muted" style={{ marginBottom: 8 }}>Reason</div>
            <input className="input" value={reason} onChange={(e)=>setReason(e.target.value)} />
          </div>

          <div style={{ gridColumn:'1 / -1', display:'flex', gap: 12, alignItems:'center' }}>
            <button className="btn primary" type="submit">Submit Travel Order</button>
            {message ? <div className={message.type === 'success' ? 'badge success' : 'badge danger'}>{message.text}</div> : <div />}
          </div>
        </form>

        <div style={{ marginTop: 22 }}>
          <div className="muted" style={{ marginBottom: 8 }}>Your Requests</div>
          <div style={{ overflowX:'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Destination</th>
                  <th>Dates</th>
                  <th>Status</th>
                  <th>Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id}>
                    <td>{r.destination}</td>
                    <td>{r.startDate} → {r.endDate}</td>
                    <td>
                      <span className={r.status === 'Approved' ? 'badge success' : r.status === 'Rejected' ? 'badge danger' : 'badge neutral'}>
                        {r.status}
                      </span>
                    </td>
                    <td>{r.totalCost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <div className="muted">No travel requests yet.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

