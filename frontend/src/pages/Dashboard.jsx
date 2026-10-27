import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { Clock, Download, LogIn, LogOut } from 'lucide-react'
import EmployeeTable from '../components/EmployeeTable.jsx'
import { apiRequest } from '../utils/api.js'
import { getTasks } from '../api/tasksApi.js'

const money = n => '₹' + Number(n || 0).toLocaleString('en-IN')
const t12 = value => value
  ? new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  : '-- : --'
const hm = h => `${String(Math.floor(h)).padStart(2, '0')}h ${String(Math.round((h % 1) * 60)).padStart(2, '0')}m`
const formatLocalDate = date => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
const todayDate = () => formatLocalDate(new Date())
const currentMonth = () => todayDate().slice(0, 7)
const csvValue = value => `"${String(value ?? '').replace(/"/g, '""')}"`
const formatDuration = (punchInAt, punchOutAt) => {
  if (!punchInAt) return ''
  if (!punchOutAt && punchInAt.slice(0, 10) !== todayDate()) return ''
  const endAt = punchOutAt ? new Date(punchOutAt).getTime() : Date.now()
  const minutes = Math.max(0, Math.round((endAt - new Date(punchInAt).getTime()) / 60000))
  return (minutes / 60).toFixed(2)
}

const Kpi = ({ label, right, rc, value, sub, pct, color, onClick }) => (
  <div className="card p-4">
    <div className="flex justify-between text-xs text-mute gap-2">
      <span>{label}</span>
      <b className={`${rc} ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>{right}</b>
    </div>
    <div className="text-3xl font-bold mt-2">{value} <span className="text-xs font-normal text-mute">{sub}</span></div>
    <div className="h-1.5 bg-line rounded mt-3">
      <div className="h-full rounded" style={{ width: Math.min(pct || 0, 100) + '%', background: color }} />
    </div>
  </div>
)

export default function Dashboard() {
  const { s, admin, user } = useOutletContext()
  const navigate = useNavigate()
  const [now, setNow] = useState(new Date())
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [leaves, setLeaves] = useState([])
  const [employeeDataError, setEmployeeDataError] = useState('')
  const [punchError, setPunchError] = useState('')
  const [isPunching, setIsPunching] = useState(false)
  const [tasks, setTasks] = useState([])
  const [tasksError, setTasksError] = useState('')
  const [exportPeriod, setExportPeriod] = useState('daily')
  const [exportDate, setExportDate] = useState(todayDate)
  const [exportMonth, setExportMonth] = useState(currentMonth)
  const [exportYear, setExportYear] = useState(() => String(new Date().getFullYear()))
  const [isExportOptionsOpen, setIsExportOptionsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const [adminData, setAdminData] = useState(null)
  const [adminDataError, setAdminDataError] = useState('')
  const [isAdminLoading, setIsAdminLoading] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!admin) return undefined
    let active = true

    const loadDashboard = async () => {
      try {
        const today = todayDate()
        const [workspace, attendanceResult, leaveResult] = await Promise.all([
          apiRequest('/workspace'),
          apiRequest(`/attendance?from=${today}&to=${today}`),
          apiRequest('/leave'),
        ])
        if (!Array.isArray(workspace.employees) || !Array.isArray(workspace.tasks) ||
            !Array.isArray(attendanceResult.attendance) || !Array.isArray(leaveResult.requests)) {
          throw new Error('The HRMS API returned invalid dashboard data.')
        }
        if (!active) return

        const attendanceByEmployee = new Map(
          attendanceResult.attendance.map(record => [Number(record.employeeId), record]),
        )
        const approvedLeaves = leaveResult.requests.filter(leave =>
          leave.status === 'Approved' && leave.fromDate <= today && leave.toDate >= today,
        )
        const employeesOnLeave = new Set(approvedLeaves.map(leave => Number(leave.employeeId)))
        const employees = workspace.employees.map(employee => {
          const id = Number(employee.id)
          const attendance = attendanceByEmployee.get(id)
          return {
            ...employee,
            employeeId: employee.employeeId || `EMP${String(id).padStart(3, '0')}`,
            department: employee.department || employee.dept || '',
            punchInAt: attendance?.punchInAt || null,
            punchOutAt: attendance?.punchOutAt || null,
            attendanceStatus: attendance?.status || (employeesOnLeave.has(id) ? 'On Leave' : 'Not recorded'),
          }
        })
        const checkedIn = attendanceResult.attendance.filter(record => record.punchInAt).length
        const departments = new Set(employees.map(employee => employee.department).filter(Boolean))
        const projectNames = new Set(workspace.tasks.map(task => task.project).filter(Boolean))
        const ongoingProjects = new Set(
          workspace.tasks
            .filter(task => String(task.status).toLowerCase() !== 'finished')
            .map(task => task.project)
            .filter(Boolean),
        )

        setAdminData({
          employees,
          total: employees.length,
          checkedIn,
          late: attendanceResult.attendance.filter(record => record.status === 'Late').length,
          onLeave: employeesOnLeave.size,
          percentage: employees.length ? Math.round((checkedIn / employees.length) * 100) : 0,
          departments: departments.size,
          projects: projectNames.size,
          ongoingProjects: ongoingProjects.size,
          pendingLeaves: leaveResult.requests.filter(leave => leave.status === 'Pending').length,
        })
        setAdminDataError('')
      } catch (error) {
        if (active) setAdminDataError(error.message)
      } finally {
        if (active) setIsAdminLoading(false)
      }
    }

    loadDashboard()
    const interval = window.setInterval(loadDashboard, 30000)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [admin, user?.id])

  useEffect(() => {
    if (admin) return undefined
    let active = true
    Promise.all([
      apiRequest('/attendance/me'),
      apiRequest('/leave'),
    ])
      .then(([attendanceResult, leaveResult]) => {
        if (!active) return
        setAttendanceRecords(attendanceResult.attendance || [])
        setLeaves(leaveResult.requests || [])
        setEmployeeDataError('')
      })
      .catch(error => {
        if (active) setEmployeeDataError(error.message)
      })
    return () => { active = false }
  }, [admin, user?.id])

  useEffect(() => {
    if (admin) return undefined
    let active = true

    const loadTasks = async () => {
      try {
        const assignedTasks = await getTasks()
        if (active) {
          setTasks(assignedTasks.filter(task => Number(task.assignedTo) === Number(user?.employeeId)))
          setTasksError('')
        }
      } catch (error) {
        if (active) setTasksError(error.message)
      }
    }

    loadTasks()
    const interval = window.setInterval(loadTasks, 30000)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [admin, user?.employeeId])

  const todayRecord = attendanceRecords.find(record => record.date === todayDate()) || {}
  const activeShift = todayRecord.punchInAt && !todayRecord.punchOutAt
  const completedToday = Boolean(todayRecord.punchOutAt)
  const startedAt = todayRecord.punchInAt ? new Date(todayRecord.punchInAt).getTime() : 0
  const finishedAt = todayRecord.punchOutAt ? new Date(todayRecord.punchOutAt).getTime() : now.getTime()
  const hours = startedAt ? Math.max(0, (finishedAt - startedAt) / 3600000) : 0
  const leavesTaken = leaves
    .filter(leave => leave.status === 'Approved')
    .reduce((totalDays, leave) => totalDays + Number(leave.days || 0), 0)
  const handlePunch = async action => {
    setIsPunching(true)
    setPunchError('')
    try {
      const { attendance } = await apiRequest(`/attendance/${action}`, {
        method: 'POST',
        body: JSON.stringify({ date: todayDate() }),
      })
      setAttendanceRecords(records => [
        attendance,
        ...records.filter(record => record.id !== attendance.id),
      ])
    } catch (error) {
      setPunchError(error.message)
    } finally {
      setIsPunching(false)
    }
  }
  const handleAttendanceExport = async () => {
    let from
    let to
    let periodValue

    if (exportPeriod === 'daily') {
      from = exportDate
      to = exportDate
      periodValue = exportDate
    } else if (exportPeriod === 'monthly') {
      const [year, month] = exportMonth.split('-').map(Number)
      from = `${exportMonth}-01`
      to = todayDateForMonth(year, month)
      periodValue = exportMonth
    } else {
      const year = Number(exportYear)
      from = `${exportYear}-01-01`
      to = `${exportYear}-12-31`
      periodValue = exportYear
    }

    setIsExporting(true)
    setExportError('')
    try {
      const { attendance } = await apiRequest(`/attendance?from=${from}&to=${to}`)
      const recordsByDate = new Map((attendance || []).map(record => [record.date, record]))
      const rows = [['Date', 'Status', 'Punch In', 'Punch Out', 'Hours']]
      const endDate = new Date(`${to}T00:00:00`)
      const date = new Date(`${from}T00:00:00`)
      while (date <= endDate) {
        const dateValue = formatLocalDate(date)
        const record = recordsByDate.get(dateValue)
        const isWeekend = date.getDay() === 0 || date.getDay() === 6
        rows.push([
          dateValue,
          record?.status || (isWeekend ? 'WO' : 'Not recorded'),
          record?.punchInAt || '',
          record?.punchOutAt || '',
          formatDuration(record?.punchInAt, record?.punchOutAt),
        ])
        date.setDate(date.getDate() + 1)
      }
      const csv = rows.map(row => row.map(csvValue).join(',')).join('\n')
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `attendance-${exportPeriod}-${periodValue}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setIsExportOptionsOpen(false)
    } catch (error) {
      setExportError(error.message)
    } finally {
      setIsExporting(false)
    }
  }
  const adminValue = value =>
    adminData === null
      ? isAdminLoading ? '…' : adminDataError ? '—' : value
      : value

  return (
    <div className="space-y-4">
      {admin && adminDataError && (
        <p role="alert" className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-400">
          Unable to load live dashboard data: {adminDataError}
        </p>
      )}
      <div className="card p-4 sm:p-6 flex flex-wrap gap-5 items-center">
        <div className="w-14 h-14 rounded-2xl border border-mint bg-mint/10 grid place-items-center text-mint"><Clock /></div>
        <div className="flex-1 min-w-[220px]">
          <div className="text-xs font-bold text-mint">COMPANY SHIFT MONITOR <span className="border border-mint/50 px-2 py-0.5 rounded ml-1 text-[10px]">GENERAL SHIFT (10:00 - 18:00)</span></div>
          <div className="mono text-3xl font-bold my-1">{now.toLocaleTimeString('en-US')}</div>
          {admin
            ? <div className="text-xs text-mute">Tracking {adminValue(adminData?.total ?? 0)} Employees across {adminValue(adminData?.departments ?? 0)} Departments • <span className="mono text-mint">{adminValue(adminData?.checkedIn ?? 0)} Checked In Today</span></div>
            : <div className="text-xs text-mute">{employeeDataError || `Your attendance for today${user?.name ? `, ${user.name}` : ''}`}</div>}
        </div>
        {admin ? (
          <div className="flex gap-3 flex-wrap items-center">
            {[
              ['PUNCHED IN', adminValue(adminData?.checkedIn ?? 0), ''],
              ['LATE PUNCHES', adminValue(adminData?.late ?? 0), 'text-amber'],
              ['ON LEAVE', adminValue(adminData?.onLeave ?? 0), 'text-sky'],
            ].map(([label, value, color]) =>
              <div key={label} className="card px-4 py-2 text-center"><div className={`text-[10px] ${color || 'text-mute'}`}>{label}</div><div className={`text-2xl font-bold ${color}`}>{value}</div></div>)}
            <button className="btn"><Download size={14} />Export Daily CSV</button></div>
        ) : (
          <div className="flex gap-3 flex-wrap items-center">
            {activeShift ? (
              <button type="button" className="btn btn-on" onClick={() => handlePunch('punch-out')} disabled={isPunching}>
                <LogOut size={14} />{isPunching ? 'Recording…' : 'Punch Out'}
              </button>
            ) : completedToday ? (
              <span className="text-sm font-semibold text-mint">Shift complete</span>
            ) : (
              <button type="button" className="btn btn-mint" onClick={() => handlePunch('punch-in')} disabled={isPunching}>
                <LogIn size={14} />{isPunching ? 'Recording…' : 'Punch In'}
              </button>
            )}
            <button
              type="button"
              className="btn"
              aria-expanded={isExportOptionsOpen}
              aria-controls="attendance-export-options"
              onClick={() => setIsExportOptionsOpen(open => !open)}
            >
              <Download size={14} />Export Attendance
            </button>
          </div>
        )}
        {!admin && isExportOptionsOpen && (
          <div id="attendance-export-options" className="w-full rounded-xl border border-line bg-app p-4">
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-xs font-semibold text-mute">
                <span className="mb-1 block">Export period</span>
                <select className="input w-auto" value={exportPeriod} onChange={event => setExportPeriod(event.target.value)}>
                  <option value="daily">Daily</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </label>
              {exportPeriod === 'daily' ? (
                <label className="text-xs font-semibold text-mute">
                  <span className="mb-1 block">Choose date</span>
                  <input aria-label="Attendance export date" type="date" className="input w-auto" value={exportDate} onChange={event => setExportDate(event.target.value)} />
                </label>
              ) : exportPeriod === 'monthly' ? (
                <label className="text-xs font-semibold text-mute">
                  <span className="mb-1 block">Choose month</span>
                  <input aria-label="Attendance export month" type="month" className="input w-auto" value={exportMonth} onChange={event => setExportMonth(event.target.value)} />
                </label>
              ) : (
                <label className="text-xs font-semibold text-mute">
                  <span className="mb-1 block">Choose year</span>
                  <input aria-label="Attendance export year" type="number" min="2000" max={new Date().getFullYear()} step="1" className="input w-28" value={exportYear} onChange={event => setExportYear(event.target.value)} />
                </label>
              )}
              <button type="button" className="btn-primary" onClick={handleAttendanceExport} disabled={isExporting || (exportPeriod === 'daily' && !exportDate) || (exportPeriod === 'monthly' && !exportMonth) || (exportPeriod === 'yearly' && !exportYear)}>
                <Download size={14} />{isExporting ? 'Exporting…' : 'Download CSV'}
              </button>
            </div>
            {exportError && <p role="alert" className="mt-3 text-sm text-rose-400">{exportError}</p>}
          </div>
        )}
        {!admin && punchError && <p role="alert" className="w-full text-sm text-rose-400">{punchError}</p>}
      </div>
      {!admin && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[['Punch In', t12(todayRecord.punchInAt)], ['Punch Out', t12(todayRecord.punchOutAt)], ['Logged Hours', hm(hours)], ['Leaves Taken', `${leavesTaken} days`]].map(([label, value]) => (
            <div key={label} className="card p-4"><div className="text-xs text-mute">{label}</div><div className="text-2xl font-bold mt-2 mono">{value}</div></div>))}
        </div>
      )}
      {!admin && (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          <section className="card p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">My Assigned Tasks</h2>
                <p className="mt-1 text-sm text-mute">Your current work and due dates.</p>
              </div>
              <button type="button" className="btn-ghost" onClick={() => navigate('/tasks')}>View My Tasks</button>
            </div>
            {tasksError ? (
              <p role="alert" className="text-sm text-rose-400">Unable to load assigned tasks: {tasksError}</p>
            ) : tasks.length ? (
              <div className="space-y-2">
                {tasks.slice(0, 4).map(task => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => navigate('/tasks')}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-app p-3 text-left transition hover:border-brand/50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{task.title}</span>
                      <span className="mt-1 block truncate text-xs text-mute">{task.project} · Due {task.due || 'Not set'}</span>
                    </span>
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${task.status === 'finished' ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-400' : task.status === 'in-progress' ? 'border-sky-400/40 bg-sky-400/10 text-sky-400' : 'border-amber-400/40 bg-amber-400/10 text-amber-400'}`}>
                      {task.status === 'in-progress' ? 'In Progress' : task.status === 'finished' ? 'Finished' : 'To Do'}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-line p-4 text-sm text-mute">No tasks are currently assigned to you.</p>
            )}
          </section>
          <TaskProgressChart tasks={tasks} />
        </div>
      )}
      {admin && (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <Kpi
              label="Present Today"
              right="Live"
              rc="text-mint"
              value={adminValue(adminData?.checkedIn ?? 0)}
              sub={`/ ${adminValue(adminData?.total ?? 0)} Staff`}
              pct={adminData?.percentage}
              color="var(--accent)"
            />
            <Kpi
              label="Active Projects"
              right={`${adminValue(adminData?.ongoingProjects ?? 0)} Ongoing`}
              rc="text-mint"
              value={`${adminValue(adminData?.projects ?? 0)} Projects`}
              sub=""
              pct={(adminData?.projects || 0) * 12}
              color="var(--accent)"
            />
            <Kpi
              label="Pending Leaves"
              rc="text-amber"
              value={adminValue(adminData?.pendingLeaves ?? 0)}
              sub="Awaiting action"
              pct={(adminData?.pendingLeaves || 0) / ((adminData?.total || 0) || 1) * 500}
              color="var(--amber)"
            />
            <Kpi label="Monthly Payroll" rc="text-mint" value={money(s.monthlyPayroll)} sub="" pct={Number(s.monthlyPayroll) ? 100 : 0} color="var(--accent)" />
          </div>
          <EmployeeTable employees={adminData?.employees || []} loading={isAdminLoading && !adminData} />
        </>
      )}
    </div>
  )
}

function todayDateForMonth(year, month) {
  const lastDay = new Date(year, month, 0).getDate()
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
}

function TaskProgressChart({ tasks }) {
  const parts = [
    { id: 'todo', label: 'To Do', color: '#fbbf24', count: tasks.filter(task => task.status === 'todo').length },
    { id: 'in-progress', label: 'In Progress', color: '#38bdf8', count: tasks.filter(task => task.status === 'in-progress').length },
    { id: 'finished', label: 'Finished', color: '#34d399', count: tasks.filter(task => task.status === 'finished').length },
  ]
  const total = tasks.length
  let current = 0
  const slices = parts.map(part => {
    const start = current
    current += total ? (part.count / total) * 100 : 0
    return `${part.color} ${start}% ${current}%`
  })

  return (
    <aside className="card p-5">
      <h2 className="text-base font-bold">My Task Progress</h2>
      <p className="mt-1 text-xs text-mute">Live status of your assigned work</p>
      <div className="my-6 flex justify-center">
        <div
          className="grid h-40 w-40 place-items-center rounded-full"
          style={{ background: total ? `conic-gradient(${slices.join(', ')})` : 'var(--line)' }}
          role="img"
          aria-label={`${parts.map(part => `${part.count} ${part.label}`).join(', ')} tasks`}
        >
          <div className="grid h-28 w-28 place-items-center rounded-full bg-card text-center">
            <div>
              <p className="text-3xl font-bold">{total}</p>
              <p className="text-xs text-mute">Assigned</p>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {parts.map(part => (
          <div key={part.id} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-mute">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: part.color }} />
              {part.label}
            </span>
            <b>{part.count}</b>
          </div>
        ))}
      </div>
    </aside>
  )
}
