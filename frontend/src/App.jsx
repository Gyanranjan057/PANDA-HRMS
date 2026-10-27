import { useCallback, useEffect, useState } from 'react'
import { createBrowserRouter, Navigate, RouterProvider, useLocation, useOutletContext } from 'react-router-dom'
import { getTasks } from './api/tasksApi'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Tasks from './pages/Tasks.jsx'
import { getWorkspace } from './lib/api'
import Login from './commonpages/Login.jsx'
import AllEmployee from './pages/Employee/AllEmployee.jsx'
import CreateEmployee from './pages/Employee/CreateEmployee.jsx'
import EmployeeProfile from './pages/Employee/EmployeeProfile.jsx'
import Attendance from './components/Attendance.jsx'
import Leave from './components/Leave.jsx'
import Settings from './components/Setting.jsx'
import { getCurrentSession, SESSION_CHANGE_EVENT } from './utils/authStorage.js'

function ProtectedLayout() {
  const location = useLocation()
  const [hasSession, setHasSession] = useState(() => Boolean(getCurrentSession()?.token))

  useEffect(() => {
    const refreshSession = () => setHasSession(Boolean(getCurrentSession()?.token))
    window.addEventListener(SESSION_CHANGE_EVENT, refreshSession)
    window.addEventListener('storage', refreshSession)
    return () => {
      window.removeEventListener(SESSION_CHANGE_EVENT, refreshSession)
      window.removeEventListener('storage', refreshSession)
    }
  }, [])

  return hasSession
    ? <Layout />
    : <Navigate to="/login" replace state={{ from: location.pathname }} />
}

function LeaveWorkspace() {
  return <Leave embedded />
}

function TaskWorkspace() {
  const { admin, query, setNotifications, user } = useOutletContext()
  const [employees, setEmployees] = useState([])
  const [tasks, setTasks] = useState([])
  const [apiError, setApiError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState('')

  const loadWorkspace = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    setApiError('')

    try {
      const [workspace, savedTasks] = await Promise.all([
        admin
          ? getWorkspace()
          : Promise.resolve({
            employees: user?.employeeId
              ? [{ id: user.employeeId, name: user.name, role: user.role }]
              : [],
          }),
        getTasks(),
      ])

      if (!Array.isArray(workspace.employees) || !Array.isArray(savedTasks)) {
        throw new Error('The HRMS API returned invalid workspace or task data.')
      }

      setEmployees(workspace.employees)
      setTasks(savedTasks)
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Unable to load tasks.')
    } finally {
      if (!silent) setIsLoading(false)
    }
  }, [admin, user?.employeeId, user?.name, user?.role])

  useEffect(() => {
    loadWorkspace()
    const intervalId = window.setInterval(() => loadWorkspace(true), 30000)
    return () => window.clearInterval(intervalId)
  }, [loadWorkspace])

  useEffect(() => {
    if (!toast) return undefined

    const timeoutId = setTimeout(() => setToast(''), 2400)
    return () => clearTimeout(timeoutId)
  }, [toast])

  const notify = message => {
    setToast(message)
    setNotifications(currentNotifications =>
      [message, ...currentNotifications].slice(0, 20),
    )
  }

  const currentUser = employees.find(employee => Number(employee.id) === Number(user?.employeeId)) || null

  return (
    <>
      {isLoading ? (
        <p className="mx-auto max-w-7xl text-sm text-mute">
          Connecting to the HRMS backend…
        </p>
      ) : apiError ? (
        <div className="panel mx-auto max-w-7xl p-6" role="alert">
          <p className="font-semibold">Unable to load the task workspace.</p>
          <p className="mt-2 text-sm text-mute">{apiError}</p>
          <button type="button" className="btn-primary mt-4" onClick={loadWorkspace}>
            Try again
          </button>
        </div>
      ) : (
        <div className="mx-auto max-w-7xl">
          <Tasks
            tasks={tasks}
            setTasks={setTasks}
            employees={employees}
            notify={notify}
            query={query}
            isAdmin={admin}
            currentUser={currentUser}
          />
        </div>
      )}
      {toast && <Toast message={toast} />}
    </>
  )
}

function Toast({ message }) {
  return (
    <div className="fixed bottom-6 left-1/2 z-70 -translate-x-1/2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-[#042018] shadow-xl">
      {message}
    </div>
  )
}

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'home', element: <Dashboard /> },
      { path: 'employee/dashboard', element: <Dashboard /> },
      { path: 'tasks', element: <TaskWorkspace /> },
      { path: 'employees', element: <AllEmployee embedded /> },
      { path: 'employees/create-employee', element: <CreateEmployee /> },
      { path: 'employees/employee-profile', element: <EmployeeProfile /> },
      { path: 'attendance', element: <Attendance /> },
      { path: 'leave', element: <LeaveWorkspace /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

export default function App() {
  return <RouterProvider router={router} />
}
