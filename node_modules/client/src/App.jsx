import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import AdminLayout from './layout/AdminLayout'
import EmployeeLayout from './layout/EmployeeLayout'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminEmployees from './pages/admin/AdminEmployees'
import AdminAttendance from './pages/admin/AdminAttendance'
import AdminPayroll from './pages/admin/AdminPayroll'
import AdminHRIS from './pages/admin/AdminHRIS'
import AdminTravel from './pages/admin/AdminTravel'
import AdminAccounting from './pages/admin/AdminAccounting'
import AdminAuditTrail from './pages/admin/AdminAuditTrail'
import AdminOvertimeApproval from './pages/admin/AdminOvertimeApproval'

import EmpDashboard from './pages/emp/EmpDashboard'
import EmpAttendance from './pages/emp/EmpAttendance'
import EmpPayroll from './pages/emp/EmpPayroll'
import EmpLeaveRequest from './pages/emp/EmpLeaveRequest'
import EmpTravel from './pages/emp/EmpTravel'
import EmpOvertimeRequest from './pages/emp/EmpOvertimeRequest'
import ChangePassword from './pages/emp/ChangePassword'
import EmpSettings from './pages/emp/EmpSettings'
import EmpAttendanceCorrection from './pages/emp/EmpAttendanceCorrection'
import EmpPunchCard from './pages/emp/EmpPunchCard'

import { useAuth } from './auth/useAuth.jsx'

export default function App(){
  const { user } = useAuth()

  return (
    <div className="page-animate">
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/admin"
          element={(user?.role === 'admin' || user?.role === 'branch_admin') ? <AdminLayout /> : <Navigate to="/login" replace />}
        >
          <Route path="" element={<AdminDashboard />} />
          <Route path="employees" element={<AdminEmployees />} />
          <Route path="attendance" element={<AdminAttendance />} />
          <Route path="payroll" element={<AdminPayroll />} />
          <Route path="hris" element={<AdminHRIS />} />
          <Route path="accounting" element={<AdminAccounting />} />
          <Route path="audit" element={<AdminAuditTrail />} />
          <Route path="travel" element={<AdminTravel />} />
          <Route path="overtime" element={<AdminOvertimeApproval />} />
        </Route>

        <Route
          path="/employee"
          element={user?.role === 'employee' ? <EmployeeLayout /> : <Navigate to="/login" replace />}
        >
          <Route path="" element={<EmpDashboard />} />
          <Route path="attendance" element={<EmpAttendance />} />
          <Route path="payroll" element={<EmpPayroll />} />
          <Route path="leave" element={<EmpLeaveRequest />} />
          <Route path="travel" element={<EmpTravel />} />
          <Route path="overtime" element={<EmpOvertimeRequest />} />
          <Route path="change-password" element={<ChangePassword />} />
          <Route path="settings" element={<EmpSettings />} />
          <Route path="corrections" element={<EmpAttendanceCorrection />} />
          <Route path="punch" element={<EmpPunchCard />} />
        </Route>

        <Route
          path="/"
          element={
            <Navigate
              to={user ? (user.role === 'admin' ? '/admin' : '/employee') : '/login'}
              replace
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
