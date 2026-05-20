﻿import React, { useEffect, useMemo, useState } from 'react'
import { FiSearch, FiPlus, FiRefreshCcw, FiUsers, FiClock, FiTrendingUp, FiEdit, FiTrash2, FiSave } from 'react-icons/fi'
import api from '../../auth/api.js'
import { useAuth } from '../../auth/useAuth.jsx'

export default function AdminEmployees(){
  const { user } = useAuth()
  const isBranchAdmin = user?.role === 'branch_admin'
  const [employees, setEmployees] = useState([])
  const [form, setForm] = useState({ name:'', email:'', jobPosition:'', branch:'', baseSalaryMonthly:'', overtimeRatePerHour:'', jobDescription:'', gender: 'Not Specified', employmentStatus: 'Active', role: 'employee' }) // Form for adding new employees
  const [editingEmployee, setEditingEmployee] = useState(null) // Employee being edited
  const [isEditModalOpen, setIsEditModalOpen] = useState(false) // State for edit modal visibility
  const [employeeToDelete, setEmployeeToDelete] = useState(null) // Employee to be deleted
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false) // State for delete confirmation modal
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  async function load(){
    setLoading(true)
    try{
      const res = await api.get('/admin/employees')
      setEmployees(res.data)
    }finally{
      setLoading(false)
    }
  }

  useEffect(() => { 
    load().catch(()=>{}) 
    if (isBranchAdmin && user?.branch) {
      setForm(s => ({ ...s, branch: user.branch }))
    }
  }, [isBranchAdmin, user])

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase()
    if(!query) return employees
    return employees.filter(emp =>
      emp.name.toLowerCase().includes(query) ||
      emp.email.toLowerCase().includes(query)
    )
  }, [employees, search])

  function handleEditClick(employee) {
    setEditingEmployee({ ...employee }) // Create a copy to edit
    setIsEditModalOpen(true)
  }

  function handleEditFormChange(e) {
    const { name, value } = e.target
    setEditingEmployee(prev => ({ ...prev, [name]: value }))
  }

  async function handleEditSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      await api.put(`/admin/employees/${editingEmployee.id}`, editingEmployee)
      setMessage({ type: 'success', text: 'Employee updated successfully.' })
      setIsEditModalOpen(false)
      await load() // Reload employees to reflect changes
    } catch (err) {
      setMessage({ type: 'danger', text: err?.response?.data?.message || 'Failed to update employee.' })
    } finally {
      setLoading(false)
    }
  }

  function handleDeleteClick(employee) {
    setEmployeeToDelete(employee)
    setIsDeleteConfirmOpen(true)
  }

  async function handleConfirmDelete() {
    if (!employeeToDelete) return

    setLoading(true)
    setMessage(null)
    try {
      await api.delete(`/admin/employees/${employeeToDelete.id}`)
      setMessage({ type: 'success', text: 'Employee deleted successfully.' })
      setIsDeleteConfirmOpen(false)
      setEmployeeToDelete(null)
      await load() // Reload employees to reflect changes
    } catch (err) {
      setMessage({ type: 'danger', text: err?.response?.data?.message || 'Failed to delete employee.' })
    } finally {
      setLoading(false)
    }
  }
  const summary = useMemo(() => {
    if(employees.length === 0) return { avgSalary: 0, avgOt: 0 }
    const totalSalary = employees.reduce((sum, emp) => sum + Number(emp.baseSalaryMonthly), 0)
    const totalOt = employees.reduce((sum, emp) => sum + Number(emp.overtimeRatePerHour), 0)
    return {
      avgSalary: totalSalary / employees.length,
      avgOt: totalOt / employees.length,
    }
  }, [employees])

  async function addEmployee(e){
    e.preventDefault()
    setLoading(true)
    setMessage(null) // Clear previous messages
    try {
      const payload = {
        ...form,
        baseSalaryMonthly: Number(form.baseSalaryMonthly),
        overtimeRatePerHour: Number(form.overtimeRatePerHour),
        jobDescription: form.jobDescription,
        role: form.role
      }
      await api.post('/admin/employees', payload)
      setForm({ name:'', email:'', jobPosition:'', branch:'', baseSalaryMonthly:'', overtimeRatePerHour:'', jobDescription:'', gender: 'Not Specified', employmentStatus: 'Active', role: 'employee' })
      await load()
      setMessage({ type: 'success', text: 'Employee added! Account is now active (Password: 123456).' })
    } catch (err) {
      setMessage({ type: 'danger', text: err?.response?.data?.message || 'Failed to create employee.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="h1">Employees</div>
          <div className="muted" style={{ marginTop: 6 }}>Add, search and review your workforce.</div>
        </div>
        <div className="badge neutral">{employees.length} total</div>
      </div>

      <div style={{ padding: 24 }}>
        <div className="dashboardStats" style={{ marginBottom: 24 }}>
          <div className="statCard cardAccent1">
            <div className="statIcon"><FiUsers /></div>
            <div>
              <div className="muted">Total Employees</div>
              <div className="statValue">{employees.length}</div>
            </div>
          </div>
          <div className="statCard cardAccent2">
            <div className="statIcon"><FiTrendingUp /></div>
            <div>
              <div className="muted">Avg. Salary</div>
              <div className="statValue">{summary.avgSalary.toLocaleString('en-PH', { style:'currency', currency:'PHP'})}</div>
            </div>
          </div>
          <div className="statCard cardAccent3">
            <div className="statIcon"><FiClock /></div>
            <div>
              <div className="muted">Avg. OT Rate</div>
              <div className="statValue">₱{summary.avgOt.toFixed(2)}</div>
            </div>
          </div>
          <div className="statCard cardAccent4">
            <div className="statIcon"><FiRefreshCcw /></div>
            <div>
              <div className="muted">Showing</div>
              <div className="statValue">{filteredEmployees.length}</div>
            </div>
          </div>
        </div>

        <div className="searchRow" style={{ marginBottom: 24, display:'flex', gap: 12, alignItems:'center', flexWrap:'wrap' }}>
          <label className="searchInput">
            <FiSearch />
            <input
              className="input"
              placeholder="Search by name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <button className="btn" type="button" onClick={load} disabled={loading}>
            Refresh
          </button>
        </div>

        <div className="grid" style={{ gap: 20 }}>
          <div className="card sectionCard">
            <div className="topbar" style={{ marginBottom: 0 }}>
              <div>
                <div className="h1" style={{ fontSize: 18 }}>Add Employee</div>
                <div className="muted subtleText">Create a new employee profile with salary details.</div>
              </div>
              <div className="badge success">Fast setup</div>
            </div>
            <form onSubmit={addEmployee} style={{ padding: 24, display:'grid', gap: 16 }}>
              <input className="input" placeholder="Full name" value={form.name} onChange={(e)=>setForm(s=>({...s, name:e.target.value}))} required />
              <input className="input" placeholder="Email" value={form.email} onChange={(e)=>setForm(s=>({...s, email:e.target.value}))} required />
              <div className="formRow" style={{ margin: 0 }}>
                <input className="input" placeholder="Job position" value={form.jobPosition} onChange={(e)=>setForm(s=>({...s, jobPosition:e.target.value}))} />
                <select className="input" value={form.branch} onChange={(e)=>setForm(s=>({...s, branch:e.target.value}))} disabled={isBranchAdmin}>
                  <option value="">Select branch</option>
                  <option value="Main Branch">Main Branch</option>
                  <option value="Miagao Branch">Miagao Branch</option>
                  <option value="Oton Branch">Oton Branch</option>
                  <option value="Guimaras Branch">Guimaras Branch</option>
                </select>
              </div>
              <div className="formRow" style={{ margin: 0 }}>
                <select className="input" value={form.role} onChange={(e)=>setForm(s=>({...s, role:e.target.value}))} disabled={isBranchAdmin}>
                  <option value="employee">Role: Employee (Default)</option>
                  <option value="branch_admin">Role: Branch Admin</option>
                  {user?.role === 'admin' && <option value="admin">Role: Super Admin</option>}
                </select>
                <div /> {/* Spacer for grid consistency */}
              </div>
              <div className="formRow" style={{ margin: 0 }}>
                <select className="input" value={form.gender} onChange={(e)=>setForm(s=>({...s, gender:e.target.value}))}>
                  <option value="Not Specified">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                <select className="input" value={form.employmentStatus} onChange={(e)=>setForm(s=>({...s, employmentStatus:e.target.value}))}>
                  <option value="Active">Active</option>
                  <option value="Resigned">Resigned</option>
                </select>
              </div>
              <div className="formRow" style={{ margin: 0 }}>
                <input className="input" type="number" placeholder="Base salary (monthly)" value={form.baseSalaryMonthly} onChange={(e)=>setForm(s=>({...s, baseSalaryMonthly:e.target.value}))} required />
                <input className="input" type="number" placeholder="Overtime rate (per hour)" value={form.overtimeRatePerHour} onChange={(e)=>setForm(s=>({...s, overtimeRatePerHour:e.target.value}))} required />
              </div>
              <div>
                <textarea className="input" placeholder="Job description" value={form.jobDescription} onChange={(e)=>setForm(s=>({...s, jobDescription:e.target.value}))} style={{ minHeight: 100 }} />
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <button className="btn primary" type="submit" disabled={loading}><FiPlus /> {loading ? 'Creating...' : 'Create employee'}</button>
                {message && <div className={message.type === 'success' ? 'badge success' : 'badge danger'}>{message.text}</div>}
              </div>
              <div className="muted subtleText">Default employee password is <b>123456</b> for new users.</div>
            </form>
          </div>

          <div className="card sectionCard">
            <div className="topbar" style={{ marginBottom: 0 }}>
              <div>
                <div className="h1" style={{ fontSize: 18 }}>Employee List</div>
                <div className="muted subtleText">A live view of your workforce and salary details.</div>
              </div>
              <div className="badge neutral">{filteredEmployees.length} displayed</div>
            </div>
            <div style={{ padding: 24, overflowX: 'auto' }}>
              <table className="table" style={{ minWidth: 620 }}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Position</th>
                    <th>Branch</th>
                    <th>Base Salary</th>
                    <th>OT Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="muted">No employees found.</td>
                    </tr>
                  ) : filteredEmployees.map(emp => (
                    <tr key={emp.id}>
                      <td>{emp.name}</td>
                      <td>{emp.email}</td>
                      <td>{emp.jobPosition || '-'}</td>
                      <td>{emp.branch || '-'}</td>
                      <td>{Number(emp.baseSalaryMonthly).toLocaleString('en-PH', { style:'currency', currency:'PHP' })}</td>
                      <td>₱{Number(emp.overtimeRatePerHour).toFixed(2)}</td>
                      <td>
                        <button className="btn" onClick={() => handleEditClick(emp)}><FiEdit /> Edit</button>
                        <button className="btn danger" onClick={() => handleDeleteClick(emp)} style={{ marginLeft: 8 }}><FiTrash2 /> Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
            </table>
            {filteredEmployees.length === 0 && !loading && (
              <div className="muted" style={{ padding: 20 }}>No employees found.</div>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Edit Employee Modal */}
      {isEditModalOpen && editingEmployee && (
        <div className="modal-overlay">
          <div className="modal card">
            <div className="topbar">
              <div className="h1" style={{ fontSize: 18 }}>Edit Employee: {editingEmployee.name}</div>
              <button className="btn" onClick={() => setIsEditModalOpen(false)}>X</button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ padding: 24, display: 'grid', gap: 16 }}>
              <div className="formRow" style={{ margin: 0 }}>
                <div>
                  <div className="muted" style={{ marginBottom: 8 }}>Full Name</div>
                  <input className="input" name="name" value={editingEmployee.name} onChange={handleEditFormChange} required />
                </div>
                <div>
                  <div className="muted" style={{ marginBottom: 8 }}>Email</div>
                  <input className="input" name="email" type="email" value={editingEmployee.email} onChange={handleEditFormChange} required />
                </div>
              </div>
              <div className="formRow" style={{ margin: 0 }}>
                <div>
                  <div className="muted" style={{ marginBottom: 8 }}>Job Position</div>
                  <input className="input" name="jobPosition" value={editingEmployee.jobPosition || ''} onChange={handleEditFormChange} />
                </div>
                <div>
                  <div className="muted" style={{ marginBottom: 8 }}>Branch</div>
                  <select className="input" name="branch" value={editingEmployee.branch || ''} onChange={handleEditFormChange}>
                    <option value="">Select branch</option>
                    <option value="Main Branch">Main Branch</option>
                    <option value="Miagao Branch">Miagao Branch</option>
                    <option value="Oton Branch">Oton Branch</option>
                    <option value="Guimaras Branch">Guimaras Branch</option>
                  </select>
                </div>
              </div>
              <div className="formRow" style={{ margin: 0 }}>
                <div>
                  <div className="muted" style={{ marginBottom: 8 }}>Gender</div>
                  <select className="input" name="gender" value={editingEmployee.gender || 'Not Specified'} onChange={handleEditFormChange}>
                    <option value="Not Specified">Not Specified</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <div className="muted" style={{ marginBottom: 8 }}>Employment Status</div>
                  <select className="input" name="employmentStatus" value={editingEmployee.employmentStatus || 'Active'} onChange={handleEditFormChange}>
                    <option value="Active">Active</option>
                    <option value="Resigned">Resigned</option>
                  </select>
                </div>
              </div>
              <div>
                <div className="muted" style={{ marginBottom: 8 }}>Job Description</div>
                <textarea className="input" name="jobDescription" value={editingEmployee.jobDescription || ''} onChange={handleEditFormChange} style={{ minHeight: 100 }} />
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button className="btn primary" type="submit" disabled={loading}>
                  <FiSave /> {loading ? 'Saving...' : 'Save Changes'}
                </button>
                {message && <div className={`badge ${message.type === 'success' ? 'success' : 'danger'}`}>{message.text}</div>}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && employeeToDelete && (
        <div className="modal-overlay">
          <div className="modal card">
            <div className="topbar">
              <div className="h1" style={{ fontSize: 18 }}>Confirm Deletion</div>
              <button className="btn" onClick={() => setIsDeleteConfirmOpen(false)}>X</button>
            </div>
            <div style={{ padding: 24 }}>
              <p className="muted">Are you sure you want to delete employee <b>{employeeToDelete.name}</b>?</p>
              <p className="muted">This action cannot be undone. All associated attendance and payroll records will also be removed.</p>
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button className="btn danger" onClick={handleConfirmDelete} disabled={loading}>
                  <FiTrash2 /> {loading ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button className="btn" onClick={() => setIsDeleteConfirmOpen(false)} disabled={loading}>
                  Cancel
                </button>
              </div>
              {message && <div className={`badge ${message.type === 'success' ? 'success' : 'danger'}`} style={{ marginTop: 12 }}>{message.text}</div>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
