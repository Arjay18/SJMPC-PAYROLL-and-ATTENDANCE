import React, { useState } from 'react'
import { FiEdit3, FiSend } from 'react-icons/fi'
import api from '../../auth/api'

export default function EmpAttendanceCorrection() {
  const [form, setForm] = useState({ date: '', reason: '', requestedStatus: 'Present' })
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/employee/corrections', form)
      alert('Correction request submitted!')
      setForm({ date: '', reason: '', requestedStatus: 'Present' })
    } catch (err) {
      alert('Failed to submit request.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{ maxWidth: 600 }}>
      <div className="topbar">
        <div className="h1">Attendance Correction</div>
        <FiEdit3 className="muted" />
      </div>
      <form onSubmit={onSubmit} style={{ padding: 24, display: 'grid', gap: 16 }}>
        <div>
          <div className="muted" style={{ marginBottom: 8 }}>Date of Incident</div>
          <input type="date" className="input" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
        </div>
        <div>
          <div className="muted" style={{ marginBottom: 8 }}>Requested Status</div>
          <select className="input" value={form.requestedStatus} onChange={e => setForm({...form, requestedStatus: e.target.value})}>
            <option value="Present">Present</option>
            <option value="Leave">Leave</option>
            <option value="Absent">Absent</option>
          </select>
        </div>
        <div>
          <div className="muted" style={{ marginBottom: 8 }}>Reason for Correction</div>
          <textarea className="input" style={{ minHeight: 100 }} required value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} />
        </div>
        <button className="btn primary" type="submit" disabled={loading}>
          <FiSend /> {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  )
}