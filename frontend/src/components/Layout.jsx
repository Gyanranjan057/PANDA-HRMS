 
// import { useEffect, useState } from 'react'
// import { NavLink, Outlet, useNavigate } from 'react-router-dom'
// import { LayoutGrid, Search, Bell, Moon, ShieldCheck, User } from 'lucide-react'
// export default function Layout() {
//   const [s, setS] = useState({ present: 0, total: 0, pendingLeaves: 0, monthlyPayroll: 0, projects: 0, departments: 0, teams: 0 }), [open, setOpen] = useState(false), [admin, setAdmin] = useState(true), [compact, setCompact] = useState(false)
//   const [theme, setTheme] = useState(localStorage.theme || 'dark'), [toast, setToast] = useState(''), [notes, setNotes] = useState([]), [bell, setBell] = useState(false)
//   const go = useNavigate(), user = { name: 'Admin', role: 'Admin' }, d = new Date()
//   const isStaff = user.role !== 'Employee'
//   useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.theme = theme }, [theme])
//   // Keep the sidebar state correct when the screen size changes (desktop = collapse strip, mobile/tablet = slide-in drawer)
//   useEffect(() => {
//     const onResize = () => { if (window.innerWidth >= 1024) setOpen(false); else setCompact(false) }
//     window.addEventListener('resize', onResize)
//     return () => window.removeEventListener('resize', onResize)
//   }, [])
//   // Click on the P logo: desktop collapses/expands the sidebar, mobile and tablet open/close the drawer
//   const toggleSide = () => window.innerWidth >= 1024 ? setCompact(c => !c) : setOpen(o => !o)
//   const logoBtn = (extra = '') => (
//     <button type="button" title="Toggle sidebar" aria-label="Toggle sidebar" onClick={toggleSide} className={`w-10 h-10 rounded-xl border-2 border-mint text-mint grid place-items-center font-bold overflow-hidden shrink-0 hover:bg-mint/10 ${extra}`}>
//       <img src="/logo.png" alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; e.target.parentNode.append('P') }} />
//     </button>)
//   const flip = () => { const t = theme === 'dark' ? 'light' : 'dark'; setTheme(t); setToast(`Switched to Reference ${t === 'dark' ? 'Dark Theme (Teal & Mint)' : 'Light Theme (Orange & White)'}`); setTimeout(() => setToast(''), 2500) }
//   const read = n => setNotes(notes.map(x => x.id === n.id ? { ...x, is_read: 1 } : x))
//   const Item = ({ to, label, Icon, meta, dot }) => (
//     <NavLink to={to} end={to === '/'} onClick={() => setOpen(false)}
//       className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${isActive ? 'bg-mint/10 text-mint border border-mint/60' : 'text-mute hover:bg-mint/5'}`}>
//       <Icon size={16} className="shrink-0" />{!compact && <span className="flex-1">{label}</span>}
//       {!compact && meta && <span className="text-[11px] text-mint bg-mint/10 rounded-full px-2 py-1 text-center">{meta}</span>}{!compact && dot && <i className="w-2 h-2 rounded-full bg-mint" />}
//     </NavLink>)
//   return (
//     <div className="min-h-screen md:p-4"><div className="bg-bg md:rounded-3xl border border-line overflow-hidden min-h-screen md:min-h-[calc(100vh-32px)] flex flex-col">
//       <div className="flex flex-1">
//         {open && <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setOpen(false)} />}
//         <aside className={`flex flex-col gap-1 w-64 ${compact ? 'lg:w-20' : ''} shrink-0 border-r border-line bg-side p-4 fixed lg:static inset-y-0 left-0 z-30 transition-all duration-300 ${open ? 'translate-x-0' : '-translate-x-full invisible'} lg:translate-x-0 lg:visible`}>
//           <div className="flex items-center gap-2 mb-3">{logoBtn()}
//             {!compact && <b className="text-lg">PANDA</b>}</div>
//           {!compact && isStaff && <div className="card p-1 flex text-xs mb-3">{[['Admin Mode', true, ShieldCheck], ['Employee View', false, User]].map(([l, v, I]) =>
//             <button key={l} onClick={() => setAdmin(v)} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg ${admin === v ? 'btn-on border' : 'text-mute'}`}><I size={12} />{l}</button>)}</div>}
//           <Item to="/" label="Dashboard" Icon={LayoutGrid} />
//         </aside>
//         <div className="flex-1 min-w-0">
//           <div className="h-[70px] border-b border-line bg-side flex items-center gap-3 px-4">
//             {logoBtn('lg:hidden')}
//              {admin ? <div className="flex-1 relative"><Search size={14} className="absolute left-3 top-3 text-mute" /><input className="inp !pl-9" placeholder="Search employee, team, leave, payroll..." onKeyDown={e => e.key === 'Enter' && go('/')} onChange={e => window.dispatchEvent(new CustomEvent('gsearch', { detail: e.target.value }))} /></div> : <div className="flex-1" />}
//              <button className="btn ml-auto sm:ml-0 !rounded-full" onClick={flip}>{theme === 'dark' ? <Moon size={13} /> : <Moon size={13} />}{theme === 'dark' ? '' : ''}</button>
//              {admin && <div className="relative"><button className="card p-2.5 relative" onClick={() => setBell(!bell)}><Bell size={16} />{notes.some(n => !n.is_read) && <i className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-mint" />}</button>
//               {bell && <div className="card absolute right-0 top-12 w-64 p-2 z-40 shadow-xl">{notes.length ? notes.map(n => <button key={n.id} onClick={() => read(n)} className={`block w-full text-left text-xs p-2 rounded ${n.is_read ? 'text-mute' : 'font-semibold'}`}>{n.message}</button>) : <p className="text-xs text-mute p-2">No notifications</p>}</div>}</div>}
//             <div className="w-10 h-10 rounded-full bg-mint text-[var(--onacc)] font-bold grid place-items-center">{(user.name || 'A')[0]}</div>
//           </div>
//           <main className="p-4 lg:p-6"><Outlet context={{ s, user, admin }} /></main>
//         </div></div>
//       {toast && <div className="fixed bottom-4 right-4 card border-mint px-4 py-3 text-xs z-50 flex items-center gap-2"><i className="w-2 h-2 rounded-full bg-mint" />{toast}</div>}
//     </div></div>
//   )
// }


import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutGrid, Search, Bell, Moon, ShieldCheck, User } from 'lucide-react'
export default function Layout() {
  const [s, setS] = useState({ present: 0, total: 0, pendingLeaves: 0, monthlyPayroll: 0, projects: 0, departments: 0, teams: 0 }), [open, setOpen] = useState(false), [admin, setAdmin] = useState(true), [compact, setCompact] = useState(false)
  const [theme, setTheme] = useState(localStorage.theme || 'dark'), [toast, setToast] = useState(''), [notes, setNotes] = useState([]), [bell, setBell] = useState(false)
  const go = useNavigate(), user = { name: 'Admin', role: 'Admin' }, d = new Date()
  const isStaff = user.role !== 'Employee'
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.theme = theme }, [theme])
  // Keep the sidebar state correct when the screen size changes (desktop = collapse strip, mobile/tablet = slide-in drawer)
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setOpen(false); else setCompact(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  // Click on the P logo: desktop collapses/expands the sidebar, mobile and tablet open/close the drawer
  const toggleSide = () => window.innerWidth >= 1024 ? setCompact(c => !c) : setOpen(o => !o)
  const logoBtn = (extra = '') => (
    <button type="button" title="Toggle sidebar" aria-label="Toggle sidebar" onClick={toggleSide} className={`w-10 h-10 rounded-xl border-2 border-mint text-mint grid place-items-center font-bold overflow-hidden shrink-0 cursor-pointer hover:bg-mint/10 ${extra}`}>
      <img src="/logo.png" alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; e.target.parentNode.append('P') }} />
    </button>)
  const flip = () => { const t = theme === 'dark' ? 'light' : 'dark'; setTheme(t); setToast(`Switched to Reference ${t === 'dark' ? 'Dark Theme (Teal & Mint)' : 'Light Theme (Orange & White)'}`); setTimeout(() => setToast(''), 2500) }
  const read = n => setNotes(notes.map(x => x.id === n.id ? { ...x, is_read: 1 } : x))
  const Item = ({ to, label, Icon, meta, dot }) => (
    <NavLink to={to} end={to === '/'} onClick={() => setOpen(false)}
      className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${isActive ? 'bg-mint/10 text-mint border border-mint/60' : 'text-mute hover:bg-mint/5'}`}>
      <Icon size={16} className="shrink-0" />{!compact && <span className="flex-1">{label}</span>}
      {!compact && meta && <span className="text-[11px] text-mint bg-mint/10 rounded-full px-2 py-1 text-center">{meta}</span>}{!compact && dot && <i className="w-2 h-2 rounded-full bg-mint" />}
    </NavLink>)
  return (
    <div className="min-h-screen md:p-4"><div className="bg-bg md:rounded-3xl border border-line overflow-hidden min-h-screen md:min-h-[calc(100vh-32px)] flex flex-col">
      <div className="flex flex-1">
        {open && <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setOpen(false)} />}
        <aside className={`flex flex-col gap-1 w-64 ${compact ? 'lg:w-20' : ''} shrink-0 border-r border-line bg-side p-4 fixed lg:static inset-y-0 left-0 z-30 transition-all duration-300 ${open ? 'translate-x-0' : '-translate-x-full invisible'} lg:translate-x-0 lg:visible`}>
          <div className="flex items-center gap-2 mb-3">{logoBtn()}
            {!compact && <b className="text-lg">PANDA</b>}</div>
          {!compact && isStaff && <div className="card p-1 flex text-xs mb-3">{[['Admin Mode', true, ShieldCheck], ['Employee View', false, User]].map(([l, v, I]) =>
            <button key={l} onClick={() => setAdmin(v)} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg ${admin === v ? 'btn-on border' : 'text-mute'}`}><I size={12} />{l}</button>)}</div>}
          <Item to="/" label="Dashboard" Icon={LayoutGrid} />
        </aside>
        <div className="flex-1 min-w-0">
          <div className="h-[70px] border-b border-line bg-side flex items-center gap-3 px-4">
            {logoBtn('lg:hidden')}
             {admin ? <div className="flex-1 relative"><Search size={14} className="absolute left-3 top-3 text-mute" /><input className="inp !pl-9" placeholder="Search employee, team, leave, payroll..." onKeyDown={e => e.key === 'Enter' && go('/')} onChange={e => window.dispatchEvent(new CustomEvent('gsearch', { detail: e.target.value }))} /></div> : <div className="flex-1" />}
             <button className="btn ml-auto sm:ml-0 !rounded-full" onClick={flip}>{theme === 'dark' ? <Moon size={13} /> : <Moon size={13} />}{theme === 'dark' ? '' : ''}</button>
             {admin && <div className="relative"><button className="card p-2.5 relative" onClick={() => setBell(!bell)}><Bell size={16} />{notes.some(n => !n.is_read) && <i className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-mint" />}</button>
              {bell && <div className="card absolute right-0 top-12 w-64 p-2 z-40 shadow-xl">{notes.length ? notes.map(n => <button key={n.id} onClick={() => read(n)} className={`block w-full text-left text-xs p-2 rounded ${n.is_read ? 'text-mute' : 'font-semibold'}`}>{n.message}</button>) : <p className="text-xs text-mute p-2">No notifications</p>}</div>}</div>}
          </div>
          <main className="p-4 lg:p-6"><Outlet context={{ s, user, admin }} /></main>
        </div></div>
      {toast && <div className="fixed bottom-4 right-4 card border-mint px-4 py-3 text-xs z-50 flex items-center gap-2"><i className="w-2 h-2 rounded-full bg-mint" />{toast}</div>}
    </div></div>
  )
}