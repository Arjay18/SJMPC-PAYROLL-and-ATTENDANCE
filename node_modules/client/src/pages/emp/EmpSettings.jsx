import React, { useState } from 'react'
import { FiUser, FiCamera, FiSave } from 'react-icons/fi'
import { useAuth } from '../../auth/useAuth.jsx'

export default function EmpSettings() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    // Mock update logic (Backend file upload implementation would be required for real storage)
    setTimeout(() => {
      setMessage({ type: 'success', text: 'Profile preferences updated! Avatar upload coming soon.' })
      setLoading(false)
    }, 800)
  }

  return (
    <div className="card">
      <div className="topbar">
        <div>
          <div className="h1">Account Settings</div>
          <div className="muted" style={{ marginTop: 6 }}>Customize your profile information and avatar.</div>
        </div>
        <div className="badge neutral">Settings</div>
      </div>

      <div style={{ padding: 24, maxWidth: 600 }}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div className="profile-avatar" style={{ width: 100, height: 100, fontSize: 40, background: '#f1f5f9' }}>
              {user?.profilePic ? <img src={user.profilePic} alt="Avatar" /> : <FiUser />}
            </div>
            <div>
              <div className="muted" style={{ marginBottom: 10 }}>Profile Photo</div>
              <button className="btn" type="button" style={{ fontSize: 13 }}>
                <FiCamera /> Change Photo
              </button>
            </div>
          </div>

          <div className="formRow">
            <div>
              <div className="muted" style={{ marginBottom: 8 }}>Display Name</div>
              <input className="input" defaultValue={user?.name} readOnly />
            </div>
            <div>
              <div className="muted" style={{ marginBottom: 8 }}>Job Title</div>
              <input className="input" defaultValue={user?.jobPosition || 'Employee'} readOnly />
            </div>
          </div>

          <div>
            <div className="muted" style={{ marginBottom: 8 }}>Job Description</div>
            <textarea 
              className="input" 
              style={{ minHeight: 100, lineHeight: 1.6 }} 
              defaultValue={user?.jobDescription || 'N/A'} 
              readOnly 
            />
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="btn primary" type="submit" disabled={loading}>
              <FiSave /> {loading ? 'Saving...' : 'Save Preferences'}
            </button>
            {message && <div className={`badge ${message.type === 'success' ? 'success' : 'danger'}`}>{message.text}</div>}
          </div>
        </form>
      </div>
    </div>
  )
}