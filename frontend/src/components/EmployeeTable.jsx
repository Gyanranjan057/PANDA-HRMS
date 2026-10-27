import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const TABS = [['all', 'All'], ['active', 'Present'], ['leave', 'On Leave']]
const time = value => value
  ? new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  : '—'
const loggedHours = (punchInAt, punchOutAt) => {
  if (!punchInAt) return '—'
  const elapsed = Math.max(0, (new Date(punchOutAt || Date.now()) - new Date(punchInAt)) / 3600000)
  const hours = Math.floor(elapsed)
  const minutes = Math.floor((elapsed % 1) * 60)
  return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`
}

export default function EmployeeTable({ employees = [], loading = false }) {
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()
  const filteredEmployees = employees.filter(employee => {
    const status = String(employee.attendanceStatus || '').toLowerCase()
    if (filter === 'active') return status === 'present' || status === 'late'
    if (filter === 'leave') return status === 'on leave' || status === 'leave'
    return true
  })

  return (
    <div className="card overflow-hidden">
      <div className="p-4 flex flex-wrap items-center gap-2">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`btn ${filter === key ? 'btn-on' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead className="text-mute text-[11px] text-left border-y border-line">
            <tr>
              <th className="p-3"><input type="checkbox" aria-label="Select all employees" /></th>
              {['EMP ID', 'EMPLOYEE', 'DEPARTMENT', 'PUNCH IN / OUT', 'LOGGED HOURS', 'STATUS'].map(heading => (
                <th key={heading} className="p-3">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="p-8 text-center text-mute">Loading employees…</td></tr>
            ) : filteredEmployees.length === 0 ? (
              <tr><td colSpan="7" className="p-8 text-center text-mute">
                {employees.length ? 'No employees match this filter.' : 'No employees yet.'}
              </td></tr>
            ) : filteredEmployees.map(employee => (
              <tr key={employee.id} className="border-b border-line last:border-0">
                <td className="p-3"><input type="checkbox" aria-label={`Select ${employee.name}`} /></td>
                <td className="p-3 font-mono">{employee.employeeId}</td>
                <td className="p-3 font-semibold">{employee.name}</td>
                <td className="p-3">{employee.department || '—'}</td>
                <td className="p-3">{time(employee.punchInAt)} / {time(employee.punchOutAt)}</td>
                <td className="p-3">{loggedHours(employee.punchInAt, employee.punchOutAt)}</td>
                <td className="p-3">{employee.attendanceStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 flex justify-end">
        <button type="button" className="btn btn-on" onClick={() => navigate('/employees')}>View All</button>
      </div>
    </div>
  )
}
