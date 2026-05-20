import React, { useEffect, useState } from 'react'
import { FiBriefcase, FiSend, FiClock } from 'react-icons/fi'
import api from '../../auth/api.js'
import { formatDate } from '../../lib/utils.js' // Corrected import path

export default function EmpLeaveRequest() {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ type: 'Vacation', startDate: '', endDate: '', reason: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    api.get('/leave/employee/my').then(res => setRows(res.data)).catch(() => {})
  }, [])

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      await api.post('/leave/submit', form)
      setForm({ type: 'Vacation', startDate: '', endDate: '', reason: '' })
      const res = await api.get('/leave/employee/my')
      setRows(res.data)
      setMessage({ type: 'success', text: 'Leave request submitted (Pending).' })
    } catch (err) {
      setMessage({ type: 'danger', text: 'Failed to submit request.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container page-animate">
      <div className="mainHeader">
        <div className="pageTitle">
          <div className="h1">Leave Requests</div>
          <div className="muted">Request time off for vacation, sick leave, or personal reasons.</div>
        </div>
        <FiBriefcase className="muted" size={32} />
      </div>

      <div className="grid">
        <div className="card">
          <div className="topbar">
            <div className="h1" style={{ fontSize: 18 }}>Request Leave</div>
          </div>
          <form onSubmit={submit} style={{ padding: 24, display: 'grid', gap: 16 }}>
            <div className="formRow" style={{ margin: 0 }}>
              <div>
                <div className="muted" style={{ marginBottom: 8 }}>Leave Type</div>
                <select className="input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  <option value="Vacation">Vacation Leave</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Emergency">Emergency Leave</option>
                </select>
              </div>
              <div>
                <div className="muted" style={{ marginBottom: 8 }}>Reason</div>
                <input className="input" placeholder="Purpose of leave" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} required />
              </div>
            </div>
            <div className="formRow" style={{ margin: 0 }}>
              <div>
                <div className="muted" style={{ marginBottom: 8 }}>Start Date</div>
                <input type="date" className="input" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} required />
              </div>
              <div>
                <div className="muted" style={{ marginBottom: 8 }}>End Date</div>
                <input type="date" className="input" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} required />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button className="btn primary" type="submit" disabled={loading}>
                <FiSend /> {loading ? 'Submitting...' : 'Submit Request'}
              </button>
              {message && <div className={`badge ${message.type === 'success' ? 'success' : 'danger'}`}>{message.text}</div>}
            </div>
          </form>
        </div>

        <div className="card">
          <div className="topbar">
            <div className="h1" style={{ fontSize: 18 }}>Request History</div>
            <FiClock className="muted" />
          </div>
          <div style={{ padding: 18, overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Dates</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id}>
                    <td>{r.type}</td>
                    <td>{formatDate(r.startDate)} → {formatDate(r.endDate)}</td>
                    <td>
                      <span className={`badge ${r.status === 'Approved' ? 'success' : r.status === 'Rejected' ? 'danger' : 'neutral'}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <div className="muted" style={{ padding: 10 }}>No leave requests yet.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}