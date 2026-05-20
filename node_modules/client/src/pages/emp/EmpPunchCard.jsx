import React, { useEffect, useState } from 'react'
import { FiClock, FiLogIn, FiLogOut } from 'react-icons/fi'
import api from '../../auth/api'

export default function EmpPunchCard() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [todayRecord, setTodayRecord] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    fetchTodayStatus()
    return () => clearInterval(timer)
  }, [])

  async function fetchTodayStatus() {
    try {
      const dateStr = new Date().toISOString().slice(0, 10)
      const res = await api.get(`/employee/attendance?date=${dateStr}`)
      // Assuming backend returns an array of records for the filtered date
      if (res.data && res.data.length > 0) {
        setTodayRecord(res.data[0])
      }
    } catch (err) {
      console.error("Failed to fetch status", err)
    }
  }

  async function handlePunch(type) {
    setLoading(true)
    setMessage(null)
    try {
      // This assumes a backend endpoint exists to handle employee-initiated punches
      await api.post('/employee/attendance/punch', { type })
      setMessage({ type: 'success', text: `Successfully clocked ${type === 'in' ? 'in' : 'out'}!` })
      await fetchTodayStatus()
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to record time.' })
    } finally {
      setLoading(false)
    }
  }

  const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const dateString = currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="card" style={{ maxWidth: 500, margin: '0 auto' }}>
      <div className="topbar">
        <div>
          <div className="h1">Time Clock</div>
          <div className="muted" style={{ marginTop: 6 }}>Log your daily attendance.</div>
        </div>
        <FiClock className="muted" />
      </div>

      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text)' }}>
            {timeString}
          </div>
          <div className="muted" style={{ fontSize: 16, marginTop: 8 }}>
            {dateString}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <button 
            className="btn primary" 
            style={{ padding: '20px', fontSize: 18 }} 
            disabled={loading || (todayRecord && todayRecord.checkInTime)}
            onClick={() => handlePunch('in')}
          >
            <FiLogIn /> {todayRecord && todayRecord.checkInTime ? `Clocked In at ${todayRecord.checkInTime}` : 'Time In'}
          </button>

          <button 
            className="btn" 
            style={{ padding: '20px', fontSize: 18 }} 
            disabled={loading || !todayRecord || (todayRecord && todayRecord.checkOutTime) || !todayRecord.checkInTime}
            onClick={() => handlePunch('out')}
          >
            <FiLogOut /> {todayRecord && todayRecord.checkOutTime ? `Clocked Out at ${todayRecord.checkOutTime}` : 'Time Out'}
          </button>
        </div>

        {message && (
          <div className={`badge ${message.type === 'success' ? 'success' : 'danger'}`} style={{ marginTop: 24, width: '100%' }}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  )
}