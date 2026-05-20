import React, { useEffect, useState, useMemo } from 'react'
import { FiShield, FiRefreshCcw, FiSearch, FiEye } from 'react-icons/fi'
import api from '../../auth/api.js'
import { formatDate } from '../../lib/utils.js'
import { useAuth } from '../../auth/useAuth.jsx' // Import useAuth
import { formatCurrency } from '../../lib/utils.js'

export default function AdminAuditTrail() {
  const { user } = useAuth() // Get user from auth context
  const isBranchAdmin = user?.role === 'branch_admin'
  const userBranch = user?.branch // Get the branch of the logged-in user
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('') // For client-side text filtering
  const [startDateFilter, setStartDateFilter] = useState('')
  const [endDateFilter, setEndDateFilter] = useState('')
  const [branchFilter, setBranchFilter] = useState(isBranchAdmin && userBranch ? userBranch : '') // Initialize branch filter

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [logsPerPage] = useState(10) // Number of logs per page

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams();
      if (startDateFilter) params.set('startDate', startDateFilter);
      if (endDateFilter) params.set('endDate', endDateFilter);
      if (branchFilter) params.set('branch', branchFilter);
      const response = await api.get(`/admin/audit-logs?${params.toString()}`);
      setLogs(response.data);
    } catch (err) {
      console.error("Audit log fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [startDateFilter, endDateFilter, branchFilter]) // Reload logs when filters change

  const clearFilters = () => {
    setSearch('')
    setStartDateFilter('')
    setEndDateFilter('')
    setBranchFilter(isBranchAdmin && userBranch ? userBranch : '')
  }

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return logs
    return logs.filter(log => 
      (log.actorName || 'System').toLowerCase().includes(query) ||
      log.actionType.toLowerCase().includes(query) || // Keep client-side text search
      log.entityType.toLowerCase().includes(query) ||
      log.metadataJson.toLowerCase().includes(query) // Also search metadata
    )
  }, [logs, search])

  const renderMetadata = (log) => {
    try {
      const data = JSON.parse(log.metadataJson);
      if (!data || Object.keys(data).length === 0) return <span className="muted">None</span>;

      const items = [];

      if (log.actionType === 'PAYROLL_GENERATE') {
        items.push(<div key="p"><b>Period:</b> {formatDate(data.periodStart)} - {formatDate(data.periodEnd)}</div>);
      } else if (log.actionType === 'UPSERT_ATTENDANCE') {
        items.push(<div key="d"><b>Date:</b> {formatDate(data.date)}</div>);
        items.push(<div key="s"><b>Status:</b> {data.status}</div>);
        if (data.checkInTime) items.push(<div key="t"><b>Time:</b> {data.checkInTime} - {data.checkOutTime || '--'}</div>);
      } else if (log.actionType === 'EMPLOYEE_DELETE') {
        items.push(<div key="n"><b>Name:</b> {data.employeeName}</div>);
      } else if (log.actionType === 'PAYROLL_APPROVE' || log.actionType === 'PAYROLL_PAY') {
        items.push(<div key="id"><b>Payroll ID:</b> {data.payrollId}</div>);
      } else {
        Object.entries(data).forEach(([key, val]) => {
          if (key === 'breakdown') return; // Hide complex nested data for simplicity
          const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
          items.push(<div key={key}><b>{label}:</b> {String(val)}</div>);
        });
      }

      return <div style={{ fontSize: '13px', lineHeight: '1.4' }}>{items}</div>;
    } catch (err) {
      return <div className="subtleText" style={{ fontSize: '11px', fontFamily: 'monospace' }}>{log.metadataJson}</div>;
    }
  };

  // Get current logs for pagination
  const indexOfLastLog = currentPage * logsPerPage
  const indexOfFirstLog = indexOfLastLog - logsPerPage
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog)

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  const totalPages = Math.ceil(filteredLogs.length / logsPerPage)

  return (
    <div className="container page-animate">
      <div className="mainHeader">
        <div className="pageTitle">
          <div className="h1">Audit Trail</div>
          <div className="muted">Monitor system activities and administrative changes.</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
           <button className="btn" onClick={load} disabled={loading}>
             <FiRefreshCcw className={loading ? 'spin' : ''} /> Refresh
           </button>
           <button className="btn" onClick={clearFilters} type="button">
             Clear Filters
           </button>
           <FiShield className="muted" size={32} />
        </div>
      </div>

      <div className="card">
        <div className="topbar">
          <div className="h1" style={{ fontSize: 18 }}>System Activity Logs</div>
          <div className="badge neutral">{filteredLogs.length} entries</div>
        </div>
        <div style={{ padding: 24 }}>
          <div className="searchRow" style={{ marginBottom: 24 }}>
            <label className="searchInput">
              <FiSearch />
              <input
                className="input"
                placeholder="Filter by administrator, action or entity..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>
          <div className="searchRow" style={{ marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <label className="searchInput" style={{ flex: '1 1 auto' }}>
              <div className="muted" style={{ marginBottom: 4 }}>From Date</div>
              <input type="date" className="input" value={startDateFilter} onChange={(e) => setStartDateFilter(e.target.value)} />
            </label>
            <label className="searchInput" style={{ flex: 1 }}>
              <div className="muted" style={{ marginBottom: 4 }}>To Date</div>
              <input type="date" className="input" value={endDateFilter} onChange={(e) => setEndDateFilter(e.target.value)} />
            </label>
            <label className="searchInput" style={{ flex: 1 }}>
              <div className="muted" style={{ marginBottom: 4 }}>Branch</div>
              <select className="input" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} disabled={isBranchAdmin}>
                <option value="">All Branches</option>
                <option value="Main Branch">Main Branch</option>
                <option value="Miagao Branch">Miagao Branch</option>
                <option value="Oton Branch">Oton Branch</option>
                <option value="Guimaras Branch">Guimaras Branch</option>
              </select>
            </label>
          </div>

          <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Branch</th> {/* New column for branch */}
                <th>Technical Metadata</th>
              </tr>
            </thead>
            <tbody>
              {currentLogs.length === 0 && !loading ? (
                <tr><td colSpan={6} className="muted">No logs recorded yet.</td></tr>
              ) : currentLogs.map(log => ( // Use currentLogs here
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 13 }}>{log.createdAt}</td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{log.actorName || 'System'}</div>
                    <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase' }}>{log.actorRole}</div>
                  </td>
                  <td>
                    <span className="badge success" style={{ fontSize: 10, border: 'none' }}>{log.actionType}</span>
                  </td>
                  <td>
                    <div className="muted" style={{ fontSize: 11 }}>{log.entityType}</div>
                    <div style={{ fontSize: 12 }}>ID: {log.entityId || 'N/A'}</div>
                  </td>
                  <td>{log.employeeBranch || 'N/A'}</td> {/* Display employee branch */}
                  <td style={{ maxWidth: 400 }}>
                    {renderMetadata(log)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20, gap: 8 }}>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  className={`btn ${currentPage === i + 1 ? 'primary' : ''}`}
                  onClick={() => paginate(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}