import React, { useEffect, useState } from 'react'
import api from '../../auth/api'

export default function AdminOvertimeApproval(){
  const [rows, setRows] = useState([])
  const [message, setMessage] = useState(null)

  useEffect(()=>{
    api.get('/overtime/admin/list').then(res => setRows(res.data)).catch(()=>{})
  }, [])

  async function decide(id, decision){
    setMessage(null)
    await api.post('/overtime/admin/decision', { id, decision, adminComment: null })
    const res = await api.get('/overtime/admin/list')
    setRows(res.data)
    setMessage({ type:'success', text:`Overtime request ${decision}.` })
  }

  return (
    <div className="card">
      <div className="topbar">
        <div>
          <div className="h1">Overtime Approval</div>
          <div className="muted" style={{ marginTop: 6 }}>Approve or reject employee overtime requests</div>
        </div>
        <div className="badge neutral">Admin</div>
      </div>

      <div style={{ padding: 18 }}>
        {message ? <div className={message.type === 'success' ? 'badge success' : 'badge danger'}>{message.text}</div> : <div />}

        <div style={{ overflowX:'auto', marginTop: 14 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Times</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td>{r.employeeName}</td>
                  <td>{r.date}</td>
                  <td>{r.checkInTime} → {r.checkOutTime}</td>
                  <td>
                    <span className={r.status === 'Approved' ? 'badge success' : r.status === 'Rejected' ? 'badge danger' : 'badge neutral'}>{r.status}</span>
                  </td>
                  <td>
                    {r.status === 'Pending' ? (
                      <div style={{ display:'flex', gap: 10 }}>
                        <button className="btn primary" type="button" onClick={()=>decide(r.id,'Approved')}>Approve</button>
                        <button className="btn danger" type="button" onClick={()=>decide(r.id,'Rejected')}>Reject</button>
                      </div>
                    ) : (
                      <span className="muted">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <div className="muted">No overtime requests yet.</div>}
        </div>
      </div>
    </div>
  )
}

