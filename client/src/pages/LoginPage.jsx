import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.jsx'

export default function LoginPage(){
  const nav = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function onSubmit(e){
    e.preventDefault()
    setLoading(true)
    setError(null)
    try{
      const res = await login(email, password)
      const user = res.user
      if (user.role === 'employee' && user.is_default_password) {
        nav('/employee/change-password', { replace: true })
      } else {
        nav(user.role === 'admin' ? '/admin' : '/employee', { replace: true })
      }
    }catch(err){
      const message = err?.response?.data?.message || err?.message || 'Login failed'
      setError(message)
      console.error('Login error:', err)
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className="authPage" style={{ background: 'transparent' }}> {/* Ensure transparent to show global background */}
      <div className="card authCard">
        <div className="topbar">
          <div>
            <div className="h1">Welcome back</div>
            <div className="muted subtleText">Sign in to manage payroll, attendance and travel requests securely.</div>
          </div>
          <div className="badge neutral">Secure Access</div>
        </div>

        <div style={{ padding: 32 }}>
          <div className="sectionHeader">
            <div className="h1">Sign in</div>
            <div className="muted subtleText">Use the seeded admin account or your employee credentials to continue.</div>
          </div>

          <form onSubmit={onSubmit} className="grid">
            <div>
              <div className="muted" style={{ marginBottom: 8 }}>Email</div>
              <input className="input" value={email} onChange={(e)=>setEmail(e.target.value)} required />
            </div>
            <div>
              <div className="muted" style={{ marginBottom: 8 }}>Password</div>
              <input className="input" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
            </div>
            <div style={{ gridColumn: '1 / -1', display:'flex', flexDirection:'column', gap: 12, marginTop: 8 }}>
              <button className="btn primary" type="submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
              {error && <div className="badge danger">{error}</div>}
            </div>
            <div style={{ gridColumn: '1 / -1' }} className="muted subtleText">
              <div>Seed admin: <b>admin@example.com</b> / <b>admin123</b></div>
              <div style={{ marginTop: 4 }}>
                Employees: Use your registered email with default password <b>123456</b>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
