 

import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { CalendarCheck, ClipboardList, LayoutGrid, Palmtree, Settings, Users } from 'lucide-react'
import { useStore } from '../ui'
import Navbar from './Navbar.jsx'
import { getCurrentSession } from '../utils/authStorage'
import { apiRequest } from '../utils/api'

const navGroups = [
  {
    title: 'MAIN',
    items: [
      { label: 'Dashboard', icon: LayoutGrid, path: '/' },
      { label: 'Tasks', icon: ClipboardList, path: '/tasks' },
      { label: 'Employees', icon: Users, path: '/employees' },
      { label: 'Attendance', icon: CalendarCheck, path: '/attendance' },
      { label: 'Leave', icon: Palmtree, path: '/leave' },
    ],
  },
]

export default function Layout() {
  const [s] = useState({ present: 0, total: 0, pendingLeaves: 0, monthlyPayroll: 0, projects: 0, departments: 0, teams: 0 })
  const [open, setOpen] = useState(false)
  const [compact, setCompact] = useState(false)
  const [query, setQuery] = useState('')
  const [theme, setTheme] = useState(() => localStorage.getItem('panda-theme') || localStorage.theme || 'dark')
  const [toast, setToast] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notes, setNotes] = useStore('notifs_v3', [])
  const user = getCurrentSession()?.user || {}
  const role = String(user.role || '').trim().toLowerCase()
  const admin = ['admin', 'administrator', 'hr', 'hr admin', 'hr super admin', 'superadmin'].includes(role)
  const visibleNavGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (item.path === '/employees') return admin
      return true
    }),
  }))

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.theme = theme
    localStorage.setItem('panda-theme', theme)
  }, [theme])

  useEffect(() => {
    let active = true
    const loadNotifications = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        const { notifications } = await apiRequest('/notifications')
        if (active) {
          setNotes(current => [
            ...notifications,
            ...current.filter(notification => typeof notification === 'string'),
          ].slice(0, 50))
        }
      } catch (error) {
        if (active) console.error('Could not load notifications.', error)
      }
    }
    loadNotifications()
    const intervalId = window.setInterval(loadNotifications, 60000)
    document.addEventListener('visibilitychange', loadNotifications)
    return () => {
      active = false
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', loadNotifications)
    }
  }, [admin, setNotes, user.id])

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setOpen(false); else setCompact(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  const toggleSide = () => window.innerWidth >= 1024 ? setCompact(value => !value) : setOpen(value => !value)
  const handleThemeToggle = isDarkMode => {
    const nextTheme = isDarkMode ? 'dark' : 'light'
    setTheme(nextTheme)
    setToast(`Switched to ${nextTheme} theme`)
    setTimeout(() => setToast(''), 2500)
  }

  return (
    <div className="min-h-screen bg-bg">
      <Navbar
        isDarkMode={theme === 'dark'}
        onThemeToggle={handleThemeToggle}
        onMenuClick={() => setOpen(value => !value)}
        onSidebarToggle={toggleSide}
        searchQuery={query}
        onSearchChange={setQuery}
        notifications={notes}
        onClearNotifications={async () => {
          await apiRequest('/notifications', { method: 'DELETE' })
          setNotes([])
        }}
        notificationsOpen={notificationsOpen}
        onNotificationsToggle={() => setNotificationsOpen(value => !value)}
      />
      <div className="flex min-h-[calc(100vh-80px)]">
        {open && <button type="button" aria-label="Close sidebar" onClick={() => setOpen(false)} className="fixed inset-0 top-14 z-20 bg-black/60 sm:top-24 lg:hidden" />}
        <aside className={`fixed bottom-0 left-0 top-14 z-30 flex w-64 flex-col gap-1 overflow-y-auto border-r border-line bg-side p-4 transition-all duration-300 sm:top-24 lg:sticky lg:top-0 lg:h-[calc(100vh-96px)] lg:shrink-0 ${compact ? 'lg:w-20' : 'lg:w-64'} ${open ? 'translate-x-0' : '-translate-x-full invisible lg:visible lg:translate-x-0'}`}>
          {visibleNavGroups.map(group => (
            <section className="mb-5" key={group.title}>
              <nav className="space-y-1">
                {group.items.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    onClick={() => setOpen(false)}
                    title={item.label}
                    className={({ isActive }) => `flex min-h-10.25 items-center gap-3 rounded-xl border px-3 py-2 text-xs font-semibold no-underline transition ${compact ? 'lg:justify-center lg:px-0' : ''} ${isActive ? 'border-mint/60 bg-mint/10 text-mint' : 'border-transparent text-mute hover:bg-mint/5'}`}
                  >
                    <item.icon size={16} className="shrink-0" />
                    {!compact && <span className="min-w-0 flex-1">{item.path === '/tasks' && !admin ? 'My Tasks' : item.label}</span>}
                  </NavLink>
                ))}
              </nav>
            </section>
          ))}
          <div className="mt-auto border-t border-line pt-3">
            <NavLink
              to="/settings"
              onClick={() => setOpen(false)}
              title="Settings"
              className={({ isActive }) => `flex min-h-10.25 items-center gap-3 rounded-xl border px-3 py-2 text-xs font-semibold no-underline transition ${compact ? 'lg:justify-center lg:px-0' : ''} ${isActive ? 'border-mint/60 bg-mint/10 text-mint' : 'border-transparent text-mute hover:bg-mint/5'}`}
            >
              <Settings size={16} className="shrink-0" />
              {!compact && <span className="min-w-0 flex-1">Settings</span>}
            </NavLink>
          </div>
        </aside>
        <main className="min-w-0 flex-1 p-4 lg:p-6">
          <Outlet context={{ s, user, admin, query, setQuery, setNotifications: setNotes, isDarkMode: theme === 'dark' }} />
        </main>
      </div>
      {toast && <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl border border-mint bg-side px-4 py-3 text-xs"><i className="h-2 w-2 rounded-full bg-mint" />{toast}</div>}
    </div>
  )
}