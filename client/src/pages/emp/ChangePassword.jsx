import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../auth/api'
import { useAuth } from '../../auth/useAuth.jsx'

export default function ChangePassword() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const nav = useNavigate()
  const { logout } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'danger', text: 'Passwords do not match.' })
      return
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'danger', text: 'Password must be at least 6 characters.' })
      return
    }

    setLoading(true)
    setMessage(null)
    try {
      await api.post('/auth/change-password', { newPassword })
      setMessage({ type: 'success', text: 'Password updated! Please log in again.' })
      setTimeout(() => {
        logout()
        nav('/login', { replace: true })
      }, 2000)
    } catch (err) {
      setMessage({ type: 'danger', text: err?.response?.data?.message || 'Failed to update password.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="topbar">
        <div>
          <div className="h1">Change Password</div>
          <div className="muted" style={{ marginTop: 6 }}>
            You are using a default password. Please update it to continue.
          </div>
        </div>
      </div>

      <div style={{ padding: 24, maxWidth: 500 }}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
          <div>
            <div className="muted" style={{ marginBottom: 8 }}>New Password</div>
            <input
              className="input"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <div className="muted" style={{ marginBottom: 8 }}>Confirm New Password</div>
            <input
              className="input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="btn primary" type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
            {message && <div className={`badge ${message.type === 'success' ? 'success' : 'danger'}`}>{message.text}</div>}
          </div>
        </form>
      </div>
    </div>
  )
}