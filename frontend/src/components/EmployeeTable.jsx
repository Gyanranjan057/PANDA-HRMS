 
import { useState } from 'react'
const TABS = [['all', 'All'], ['active', 'Present'], ['leave', 'On Leave']]
export default function EmployeeTable() {
  const [filter, setFilter] = useState('all')
  return (
    <div className="card overflow-hidden">
      <div className="p-4 flex flex-wrap items-center gap-2">
        {TABS.map(([k, l]) => <button key={k} onClick={() => setFilter(k)} className={`btn ${filter === k ? 'btn-on' : ''}`}>{l}</button>)}
      </div>
      <div className="overflow-x-auto"><table className="w-full text-sm min-w-[860px]">
        <thead className="text-mute text-[11px] text-left border-y border-line"><tr><th className="p-3"><input type="checkbox" /></th>
          {['EMP ID', 'EMPLOYEE', 'DEPARTMENT', 'PUNCH IN / OUT', 'LOGGED HOURS', 'SALARY', 'STATUS'].map(h => <th key={h} className="p-3">{h}</th>)}</tr></thead>
        <tbody><tr><td colSpan="8" className="p-8 text-center text-mute">No employees yet.</td></tr></tbody></table></div>
      <div className="p-4 flex justify-end"><button className="btn btn-on">View All</button></div>
    </div>)
}