import React, { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { FiUsers, FiCalendar, FiDollarSign, FiGrid, FiSettings, FiUser, FiClock, FiMenu, FiX, FiChevronDown, FiLogOut, FiBookOpen, FiAward, FiBriefcase, FiEdit, FiShield } from 'react-icons/fi'
import { useAuth } from '../auth/useAuth.jsx'

import api from '../auth/api.js'


export default function SideMenu({ role }){
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const items = (role === 'admin' || role === 'branch_admin')
    ? [
        { to: '/admin', label: 'Dashboard', icon: <FiGrid /> },
        { to: '/admin/hris', label: 'HRIS', icon: <FiAward /> },
        { to: '/admin/employees', label: 'Employees', icon: <FiUsers /> },
        { to: '/admin/attendance', label: 'Attendance', icon: <FiCalendar /> },
        { to: '/admin/payroll', label: 'Payroll', icon: <FiDollarSign /> },
        { to: '/admin/accounting', label: 'Accounting', icon: <FiBookOpen /> },
        { to: '/admin/audit', label: 'Audit Trail', icon: <FiShield /> },
        { to: '/admin/travel', label: 'Travel Orders', icon: <FiCalendar /> },
        { to: '/admin/overtime', label: 'Overtime Requests', icon: <FiCalendar /> },
      ]


    : [
        { to: '/employee', label: 'Dashboard', icon: <FiGrid /> },
        { to: '/employee/attendance', label: 'My Attendance', icon: <FiCalendar /> },
        { to: '/employee/payroll', label: 'My Payroll', icon: <FiDollarSign /> },
        { to: '/employee/leave', label: 'Leave Requests', icon: <FiBriefcase /> },
        { to: '/employee/travel', label: 'Travel Orders', icon: <FiCalendar /> },
        { to: '/employee/overtime', label: 'Overtime Requests', icon: <FiCalendar /> },
        { to: '/employee/corrections', label: 'Corrections', icon: <FiCalendar /> },
        { to: '/employee/punch', label: 'Time Clock', icon: <FiClock /> },
        { to: '/employee/settings', label: 'Settings', icon: <FiSettings /> },
      ]



  return (
    <div className="app-container">
      <header className="header">
        <div className="header-left">
          <button className="mobile-toggle-btn" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle Menu">
            {isOpen ? <FiX /> : <FiMenu />}
          </button>
          <div className="brand" style={{ borderBottom: 'none', margin: 0, paddingBottom: 0 }}>
            <div className="logo" />
            <div>
              <div className="brandTitle">SJMPc</div>
              <div className="muted" style={{ fontSize: 11 }}>Payroll System</div>
            </div>
          </div>
        </div>

        <div className="header-right">
          <div className="user-dropdown-container">
            <div className="user-profile-toggle" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
              <div className="profile-avatar-small">
                {user?.profilePic ? <img src={user.profilePic} alt="P" /> : <FiUser />}
              </div>
              <div className="profile-meta-small">
                <div className="profile-name-small">{user?.name || 'User'}</div>
                <div className="profile-role-small">{role}</div>
              </div>
              <FiChevronDown className={`dropdown-arrow ${isUserMenuOpen ? 'rotated' : ''}`} />
            </div>

            {isUserMenuOpen && (
              <div className="dropdown-menu">
                <button className="dropdown-item danger" onClick={logout}>
                  <FiLogOut /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="layout">

      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <nav className="nav">
          {items.map(it => (
            <NavLink key={it.to} to={it.to} className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => setIsOpen(false)} end>
              <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
                <span style={{ opacity: .95 }}>{it.icon}</span>
                <span style={{ fontWeight: 700 }}>{it.label}</span>
              </div>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="main" style={{ background: 'transparent' }}>
        <Outlet />
      </main>
    </div>
    </div>
  )
}
