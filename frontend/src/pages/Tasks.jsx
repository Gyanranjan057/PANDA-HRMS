import React, { useMemo, useState } from 'react'
import { Icon } from '../ui'
import {
  ALL_META, STATUS_META, calculateTaskCounts, filterTasksByStatus,
  groupByProject, searchTasks,
} from '../lib/tasks'
import { createTask, updateTask, deleteTask } from '../api/tasksApi'
import TaskSummary from '../components/tasks/TaskSummary'
import TaskFilters from '../components/tasks/TaskFilters'
import ProjectGroup from '../components/tasks/ProjectGroup'
import { AssignModal, ReassignModal, DetailsModal } from '../components/tasks/TaskModals'

const Tasks = ({ tasks, setTasks, employees, notify, query, isAdmin, currentUser }) => {
  const [status, setStatus] = useState('all')
  const [modal, setModal] = useState(null)

  const getDev = id => employees.find(e => e.id === Number(id))
  const open = (type, task) => setModal({ type, task })
  const close = () => setModal(null)

  // admin sees everything, employee only their own tasks
  const scoped = isAdmin ? tasks : tasks.filter(t => t.assignedTo === currentUser?.id)
  const counts = useMemo(() => calculateTaskCounts(scoped), [scoped])
  const visible = searchTasks(filterTasksByStatus(scoped, status), query, getDev)
  const projects = [...new Set(tasks.map(t => t.project))]
  const meta = status === 'all' ? ALL_META : STATUS_META[status]

  // save to MySQL through the API, then show what the server returned
  const change = async (task, changes, message) => {
    try {
      const saved = await updateTask(task.id, changes)
      setTasks(list => list.map(t => (t.id === saved.id ? saved : t)))
      notify(message)
      close()
    } catch (err) {
      notify(err.message)
    }
  }

  const setTaskStatus = (task, next) =>
    change(
      task,
      { status: next },
      `${task.id} moved to ${STATUS_META[next].label}`
    )

  const reassign = (task, employeeId) =>
    change(task, { assignedTo: employeeId }, `${task.id} reassigned to ${getDev(employeeId)?.name}`)

  const assign = async details => {
    try {
      const created = await createTask(details)
      setTasks(list => [...list, created])
      notify('Deliverable assigned')
      close()
    } catch (err) {
      notify(err.message)
    }
  }

  const remove = async task => {
    if (!confirm(`Delete ${task.id}?`)) return
    try {
      await deleteTask(task.id)
      setTasks(list => list.filter(t => t.id !== task.id))
      notify(`${task.id} deleted`)
      close()
    } catch (err) {
      notify(err.message)
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-brand/10 px-4 py-2 text-sm font-semibold text-brand">
          Projects &amp; To-Do Workflow
        </span>
        {isAdmin && (
          <button className="btn-primary ml-auto" onClick={() => open('assign')}>
            <Icon name="plus" className="h-4 w-4" />
            Assign Deliverable to Developer
          </button>
        )}
      </div>

      <h1 className="text-3xl font-bold md:text-4xl">Task Board</h1>
      <p className="mb-6 mt-2 text-mute">
        {isAdmin
          ? 'Select project deliverables, assign developers, finish assignments, and check real-time developer status.'
          : 'Track your assigned deliverables, update progress, and see what needs to be done next.'}
      </p>

      <TaskSummary counts={counts} active={status} onSelect={setStatus} />
      <TaskFilters status={status} counts={counts} onChange={setStatus} />

      {visible.length === 0 ? (
        <div className="panel grid place-items-center gap-3 p-14 text-center">
          <Icon name={query ? 'search' : meta.icon} className="h-10 w-10 text-mute" />
          <h3 className="text-xl font-bold">
            {query ? 'No matching tasks' : `No ${status === 'all' ? '' : `${meta.label} `}Tasks`}
          </h3>
          <p className="max-w-md text-sm text-mute">
            {query
              ? `Nothing matches "${query}" with this status filter.`
              : status === 'all' ? 'There are no tasks to show yet.' : meta.emptyText}
          </p>
          {status !== 'all' && (
            <button className="btn-primary" onClick={() => setStatus('all')}>View All Tasks</button>
          )}
        </div>
      ) : (
        groupByProject(visible).map(g => (
          <ProjectGroup key={g.project} {...g} isAdmin={isAdmin} getDev={getDev} open={open} onSetStatus={setTaskStatus} />
        ))
      )}

      {modal?.type === 'assign' && <AssignModal employees={employees} projects={projects} onSave={assign} onClose={close} />}
      {modal?.type === 'reassign' && <ReassignModal task={modal.task} employees={employees} onSave={reassign} onClose={close} />}
      {modal?.type === 'view' && (
        <DetailsModal task={modal.task} dev={getDev(modal.task.assignedTo)} isAdmin={isAdmin} onDelete={remove} onClose={close} />
      )}
    </div>
  )
}

export default Tasks