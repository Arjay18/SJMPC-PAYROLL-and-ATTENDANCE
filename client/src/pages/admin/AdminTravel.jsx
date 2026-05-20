import React, { useEffect, useMemo, useState } from 'react'
import { FiSearch, FiRefreshCcw, FiCheckCircle, FiXCircle, FiMapPin, FiCalendar, FiClock } from 'react-icons/fi'
import api from '../../auth/api'

const statusOptions = ['All', 'Pending', 'Approved', 'Rejected']

export default function AdminTravel(){
  const [rows, setRows] = useState([])
  const [message, setMessage] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [loading, setLoading] = useState(false)

  async function loadRows(){
    setLoading(true)
    try{
      const res = await api.get('/travel/admin/list')
      setRows(res.data)
    }finally{
      setLoading(false)
    }
  }

  useEffect(()=>{ loadRows().catch(()=>{}) }, [])

  async function decide(id, decision){
    setMessage(null)
    await api.post('/travel/admin/decision', {
      id,
      decision,
      adminComment: null
    })
    await loadRows()
    setMessage({ type:'success', text:`Travel order ${decision}.` })
  }

  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      const term = search.trim().toLowerCase()
      const matchesSearch = !term || [row.employeeName, row.destination, row.reason].some(value => String(value || '').toLowerCase().includes(term))
      const matchesStatus = statusFilter === 'All' || row.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [rows, search, statusFilter])

  const stats = useMemo(() => {
    const total = rows.length
    const approved = rows.filter(r => r.status === 'Approved').length
    const rejected = rows.filter(r => r.status === 'Rejected').length
    const pending = rows.filter(r => r.status === 'Pending').length
    return { total, approved, rejected, pending }
  }, [rows])

  function statusBadge(status){
    const className = status === 'Approved' ? 'badge success' : status === 'Rejected' ? 'badge danger' : 'badge neutral'
    return <span className={className}>{status}</span>
  }

  return (
    <div className="card">
      <div className="topbar">
        <div>
          <div className="h1">Travel Orders</div>
          <div className="muted" style={{ marginTop: 6 }}>Review, approve, or reject employee travel requests in one place.</div>
        </div>
        <div className="badge neutral">Admin dashboard</div>
      </div>

      <div style={{ padding: 24 }}>
        <div className="dashboardStats" style={{ marginBottom: 24 }}>
          <div className="statCard cardAccent1">
            <div className="statIcon"><FiMapPin /></div>
            <div>
              <div className="muted">Requests</div>
              <div className="statValue">{stats.total}</div>
            </div>
          </div>
          <div className="statCard cardAccent2">
            <div className="statIcon"><FiCheckCircle /></div>
            <div>
              <div className="muted">Approved</div>
              <div className="statValue">{stats.approved}</div>
            </div>
          </div>
          <div className="statCard cardAccent3">
            <div className="statIcon"><FiXCircle /></div>
            <div>
              <div className="muted">Rejected</div>
              <div className="statValue">{stats.rejected}</div>
            </div>
          </div>
          <div className="statCard cardAccent4">
            <div className="statIcon"><FiClock /></div>
            <div>
              <div className="muted">Pending</div>
              <div className="statValue">{stats.pending}</div>
            </div>
          </div>
        </div>

        <div className="searchRow" style={{ display:'flex', gap: 14, flexWrap:'wrap', alignItems:'center', marginBottom: 20 }}>
          <label className="searchInput">
            <FiSearch />
            <input
              className="input"
              placeholder="Search by employee, destination, or reason"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ maxWidth: 220 }}>
            {statusOptions.map(option => <option key={option} value={option}>{option}</option>)}
          </select>
          <button className="btn" type="button" onClick={loadRows} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</button>
          <div className="badge neutral" style={{ marginLeft: 'auto' }}>{filteredRows.length} shown</div>
        </div>

        <div style={{ overflowX:'auto' }}>
          <table className="table" style={{ minWidth: 920 }}>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Destination</th>
                <th>Travel dates</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="muted">No matching travel orders found.</td>
                </tr>
              ) : filteredRows.map(r => (
                <tr key={r.id}>
                  <td>{r.employeeName}</td>
                  <td>{r.destination}</td>
                  <td>{r.startDate} → {r.endDate}</td>
                  <td style={{ maxWidth: 260, whiteSpace:'normal', lineHeight: 1.5 }}>{r.reason || '-'}</td>
                  <td>{statusBadge(r.status)}</td>
                  <td>
                    {r.status === 'Pending' ? (
                      <div style={{ display:'flex', gap: 10, flexWrap:'wrap' }}>
                        <button className="btn primary" type="button" onClick={()=>decide(r.id,'Approved')}>Approve</button>
                        <button className="btn danger" type="button" onClick={()=>decide(r.id,'Rejected')}>Reject</button>
                      </div>
                    ) : (
                      <span className="muted">No action</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
