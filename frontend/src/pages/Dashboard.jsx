import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Clock, Download, LogIn, LogOut } from 'lucide-react'
import EmployeeTable from '../components/EmployeeTable.jsx'
import { apiRequest } from '../utils/api'
const money = n => '₹' + Number(n || 0).toLocaleString('en-IN')
const formatLocalDate = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const formatPunchTime = value => value ? new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : '-- : --'
const hm = h => `${String(Math.floor(h)).padStart(2, '0')}h ${String(Math.round((h % 1) * 60)).padStart(2, '0')}m`
const SEG = [['Completed', 'var(--accent)'], ['In Progress', 'var(--sky)'], ['Pending', 'var(--amber)']]
const BADGE = { Completed: 'text-mint bg-mint/10 border-mint/60', 'In Progress': 'text-sky bg-sky/10 border-sky/60', Pending: 'text-amber bg-amber/10 border-amber/60' }
const Kpi = ({ label, right, rc, value, sub, pct, color, onClick }) => (
  <div className="card p-4"><div className="flex justify-between text-xs text-mute gap-2"><span>{label}</span><b className={`${rc} ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>{right}</b></div>
    <div className="text-3xl font-bold mt-2">{value} <span className="text-xs font-normal text-mute">{sub}</span></div>
    <div className="h-1.5 bg-line rounded mt-3"><div className="h-full rounded" style={{ width: Math.min(pct || 0, 100) + '%', background: color }} /></div></div>)
export default function Dashboard() {
  const { s, admin, user } = useOutletContext()
  const [now, setNow] = useState(new Date())
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(true)
  const [attendanceLoaded, setAttendanceLoaded] = useState(false)
  const [isPunching, setIsPunching] = useState(false)
  const [attendanceError, setAttendanceError] = useState('')
  const [reloadAttendance, setReloadAttendance] = useState(0)
  const a = { total: 0, checkedIn: 0, late: 0, approvedLeaves: 0, percentage: 0, delta: null }
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])

  useEffect(() => {
    if (admin) return undefined

    let active = true
    setIsAttendanceLoading(true)
    apiRequest('/attendance/me')
      .then(({ attendance = [] }) => {
        if (active) {
          setAttendanceRecords(attendance)
          setAttendanceLoaded(true)
        }
      })
      .catch(error => {
        if (active) setAttendanceError(error.message)
      })
      .finally(() => {
        if (active) setIsAttendanceLoading(false)
      })

    return () => { active = false }
  }, [admin, reloadAttendance])

  const today = formatLocalDate(now)
  const todayRecord = attendanceRecords.find(record => record.date === today)
  const activeShift = attendanceRecords.find(record => record.date === today && record.punchInAt && !record.punchOutAt)
  const completedToday = Boolean(todayRecord?.punchOutAt)
  const punchInAt = activeShift?.punchInAt || todayRecord?.punchInAt
  const punchOutAt = todayRecord?.punchOutAt
  const shiftEnd = activeShift ? now : punchOutAt ? new Date(punchOutAt) : null
  const hours = punchInAt && shiftEnd ? Math.max(0, (shiftEnd.getTime() - new Date(punchInAt).getTime()) / 3600000) : 0

  const handlePunch = async action => {
    setIsPunching(true)
    setAttendanceError('')
    try {
      const { attendance } = await apiRequest(`/attendance/${action}`, {
        method: 'POST',
        body: JSON.stringify({ date: formatLocalDate(new Date()) }),
      })
      setAttendanceRecords(previous => [attendance, ...previous.filter(record => record.id !== attendance.id)])
    } catch (error) {
      setAttendanceError(error.message)
    } finally {
      setIsPunching(false)
    }
  }

  const handleAttendanceRetry = () => {
    setAttendanceError('')
    setIsAttendanceLoading(true)
    setAttendanceLoaded(false)
    setReloadAttendance(count => count + 1)
  }

  const tasks = []
  const cnt = st => tasks.filter(t => t.status === st).length
  const total = tasks.length, C = 2 * Math.PI * 40
  let off = 0
  return (
    <div className="space-y-4">
      <div className="card p-4 sm:p-6 flex flex-wrap gap-5 items-center">
        <div className="w-14 h-14 rounded-2xl border border-mint bg-mint/10 grid place-items-center text-mint"><Clock /></div>
        <div className="flex-1 min-w-55">
          <div className="text-xs font-bold text-mint">COMPANY SHIFT MONITOR <span className="border border-mint/50 px-2 py-0.5 rounded ml-1 text-[10px]">GENERAL SHIFT (10:00 - 18:00)</span></div>
          <div className="mono text-3xl font-bold my-1">{now.toLocaleTimeString('en-US')}</div>
          {admin
            ? <div className="text-xs text-mute">Tracking {a.total} Employees across {s.departments} Departments • <span className="mono text-mint">{a.checkedIn} Checked In Today</span></div>
            : <div className="text-xs text-mute">Your attendance for today · {isAttendanceLoading ? 'Loading status' : activeShift ? 'On shift' : completedToday ? 'Shift complete' : 'Not punched in'}</div>}
        </div>
        {admin ? (
          <div className="flex gap-3 flex-wrap items-center">
            {[['PUNCHED IN', a.checkedIn, ''], ['LATE PUNCHES', a.late, 'text-amber'], ['ON LEAVE', a.approvedLeaves, 'text-sky']].map(([l, v, c]) =>
              <div key={l} className="card px-4 py-2 text-center"><div className={`text-[10px] ${c || 'text-mute'}`}>{l}</div><div className={`text-2xl font-bold ${c}`}>{v}</div></div>)}
            <button className="btn"><Download size={14} />Export Daily CSV</button></div>
        ) : (
          <div className="flex gap-3 flex-wrap items-center">
            {activeShift ? (
              <button type="button" className="btn btn-on" onClick={() => handlePunch('punch-out')} disabled={isAttendanceLoading || isPunching || !attendanceLoaded}>
                <LogOut size={14} />{isPunching ? 'Recording...' : 'Punch Out'}
              </button>
            ) : completedToday ? (
              <span className="text-sm font-semibold text-mint">Attendance complete for today.</span>
            ) : (
              <button type="button" className="btn btn-mint" onClick={() => handlePunch('punch-in')} disabled={isAttendanceLoading || isPunching || !attendanceLoaded}>
                <LogIn size={14} />{isPunching ? 'Recording...' : 'Punch In'}
              </button>
            )}
            {attendanceError && <p className="text-sm text-rose-400" role="alert">{attendanceError}</p>}
            {!attendanceLoaded && !isAttendanceLoading && <button type="button" className="text-sm font-semibold text-mint underline underline-offset-4" onClick={handleAttendanceRetry}>Retry</button>}
          </div>
        )}
      </div>
      {!admin && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[['Punch In', formatPunchTime(punchInAt)], ['Punch Out', formatPunchTime(punchOutAt)], ['Logged Hours', hm(hours)], ['Leaves Taken', `${user?.leavesTaken || user?.leaves_taken || 0} days`]].map(([l, v]) => (
            <div key={l} className="card p-4"><div className="text-xs text-mute">{l}</div><div className="text-2xl font-bold mt-2 mono">{v}</div></div>))}
        </div>
      )}
      {!admin && (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="card p-4 lg:col-span-2">
            <h3 className="font-bold mb-3">My Tasks</h3>
            {!tasks.length ? <p className="text-sm text-mute">No tasks assigned yet.</p> : tasks.map(t => (
              <div key={t.id} className="flex items-center gap-3 py-3 border-t border-line">
                <div className="flex-1 min-w-0"><div className="font-semibold truncate">{t.title}</div>
                  <div className="text-xs text-mute truncate">{t.description}{t.due ? ` • Due ${t.due}` : ''}</div></div>
                <span className={`border rounded-full px-3 py-1 text-[11px] font-bold whitespace-nowrap ${BADGE[t.status]}`}>{t.status}</span>
              </div>))}
          </div>
          <div className="card p-4">
            <h3 className="font-bold mb-3">Task Progress</h3>
            <div className="flex flex-col items-center gap-4">
              <svg viewBox="0 0 100 100" className="w-40 h-40 -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" strokeWidth="16" style={{ stroke: 'var(--line)' }} />
                {total > 0 && SEG.map(([k, c]) => { const len = (cnt(k) / total) * C, el = <circle key={k} cx="50" cy="50" r="40" fill="none" strokeWidth="16" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-off} style={{ stroke: c }} />; off += len; return el })}
              </svg>
              <div className="w-full space-y-2 text-sm">
  {SEG.map(([k, c]) => <div key={k} className="flex items-center gap-2"><i className="w-3 h-3 rounded-full" style={{ background: c }} /><span className="flex-1">{k}</span>{total > 0 && <b>{cnt(k)}</b>}</div>)}
  {total > 0 && <div className="flex justify-between text-xs text-mute pt-2 border-t border-line"><span>Total tasks</span><b>{total}</b></div>}
</div>
            </div>
          </div>
        </div>
      )}
      {admin && (<>
        <div className="grid sm:grid-cols-2 gap-4">
          <Kpi label="Present Today" right={a.delta == null ? 'Live' : `${a.delta >= 0 ? '+' : ''}${a.delta}%`} rc="text-mint" value={s.present} sub={`/ ${s.total} Staff`} pct={a.percentage} color="var(--accent)" />
          <Kpi label="Active Projects" right={`${s.projects} Ongoing`} rc="text-mint" value={`${s.projects} Projects`} sub="" pct={(s.projects || 0) * 12} color="var(--accent)" />
          <Kpi label="Pending Leaves" rc="text-amber" value={s.pendingLeaves} sub="Awaiting action" pct={(s.pendingLeaves / (s.total || 1)) * 500} color="var(--amber)" />
          <Kpi label="Monthly Payroll" rc="text-mint" value={money(s.monthlyPayroll)} sub="" pct={Number(s.monthlyPayroll) ? 100 : 0} color="var(--accent)" />
        </div>
        <EmployeeTable />
      </>)}
    </div>
  )
}