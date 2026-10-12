import { useState } from 'react'
import { Avatar, Field, Icon, Modal } from '../../ui'
import { PRIORITY_META, STATUS_META, STATUS_ORDER, projectMeta } from '../../lib/tasks'
import { PriorityBadge, StatusBadge } from './Badges'

const AssignModal = ({ employees, projects, onSave, onClose }) => {
  const [task, setTask] = useState({
    title: '',
    description: '',
    project: projects[0] || '',
    priority: 'medium',
    due: '',
    assignedTo: employees[0]?.id,
  })

  const updateTaskField = event => {
    const { name, value } = event.target

    setTask(currentTask => ({
      ...currentTask,
      [name]: name === 'assignedTo' ? Number(value) : value,
    }))
  }

  const submitTask = event => {
    event.preventDefault()
    onSave({ ...task, title: task.title.trim() })
  }

  return (
    <Modal title="Assign Deliverable" onClose={onClose} wide>
      <form onSubmit={submitTask}>
        <Field label="Task title">
          <input
            name="title"
            required
            autoFocus
            className="input"
            value={task.title}
            onChange={updateTaskField}
          />
        </Field>

        <Field label="Description">
          <textarea
            name="description"
            rows="3"
            className="input"
            value={task.description}
            onChange={updateTaskField}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Project">
            <input
              name="project"
              list="projects"
              required
              className="input"
              value={task.project}
              onChange={updateTaskField}
            />
            <datalist id="projects">
              {projects.map(project => (
                <option key={project} value={project} />
              ))}
            </datalist>
          </Field>

          <Field label="Developer">
            <select
              name="assignedTo"
              className="input"
              value={task.assignedTo}
              onChange={updateTaskField}
            >
              {employees.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} — {employee.role}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Priority">
            <select
              name="priority"
              className="input"
              value={task.priority}
              onChange={updateTaskField}
            >
              {Object.entries(PRIORITY_META).map(([priority, details]) => (
                <option key={priority} value={priority}>
                  {details.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Due">
            <input
              name="due"
              required
              className="input"
              value={task.due}
              onChange={updateTaskField}
            />
          </Field>
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Assign Deliverable
          </button>
        </div>
      </form>
    </Modal>
  )
}

const ReassignModal = ({ task, employees, onSave, onClose }) => {
  const [employeeId, setEmployeeId] = useState(task.assignedTo)

  return (
    <Modal title={`Reassign ${task.id}`} onClose={onClose}>
      <p className="mb-3 text-sm text-mute">{task.title}</p>

      <div className="mb-4 max-h-64 space-y-1 overflow-y-auto">
        {employees.map(employee => {
          const isSelected = employeeId === employee.id

          return (
            <button
              key={employee.id}
              type="button"
              onClick={() => setEmployeeId(employee.id)}
              className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left ${
                isSelected
                  ? 'border-brand bg-brand/10'
                  : 'border-transparent hover:bg-app'
              }`}
            >
              <Avatar name={employee.name} src={employee.avatar} />
              <span className="text-sm">
                <b>{employee.name}</b>
                <br />
                <span className="text-xs text-mute">
                  {employee.role} · {employee.status}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={() => onSave(task, employeeId)}
        >
          Reassign
        </button>
      </div>
    </Modal>
  )
}

const StatusModal = ({ task, onSave, onClose }) => (
  <Modal title={`Change status · ${task.id}`} onClose={onClose}>
    <div className="space-y-2">
      {STATUS_ORDER.map(status => {
        const isCurrentStatus = task.status === status

        return (
          <button
            key={status}
            type="button"
            onClick={() => onSave(task, status)}
            className={`flex w-full items-center justify-between rounded-xl border p-3 text-left ${
              isCurrentStatus
                ? 'border-brand bg-brand/10'
                : 'border-line hover:border-brand/40'
            }`}
          >
            <span className="flex items-center gap-2 font-semibold">
              <Icon name={STATUS_META[status].icon} className={`h-4 w-4 ${STATUS_META[status].text}`} />
              {STATUS_META[status].label}
            </span>
            {isCurrentStatus && (
              <span className="text-xs text-brand">Current</span>
            )}
          </button>
        )
      })}
    </div>
  </Modal>
)

const UpdateModal = ({ task, onSave, onClose }) => {
  const [progress, setProgress] = useState(task.progress)

  return (
    <Modal title={`Update progress · ${task.id}`} onClose={onClose}>
      <p className="mb-4 text-sm text-mute">{task.title}</p>

      <div className="mb-1 flex justify-between text-sm">
        <span className="text-mute">Progress</span>
        <b className="text-brand">{progress}%</b>
      </div>

      <input
        type="range"
        min="0"
        max="100"
        step="5"
        value={progress}
        onChange={event => setProgress(Number(event.target.value))}
        className="mb-4 w-full accent-[#10e0a0]"
      />

      {progress === 100 && (
        <p className="mb-3 text-xs text-emerald-400">
          At 100% this deliverable will be marked Finished.
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={() => onSave(task, progress)}
        >
          Save progress
        </button>
      </div>
    </Modal>
  )
}
const EmployeeUpdateModal = ({ task, onSave, onClose }) => {
  const [progress, setProgress] = useState(task.progress)
  const projectDetails = projectMeta(task.project)

  // status shown on the card while the slider moves (same rule as saving)
  const previewStatus =
    progress >= 100
      ? 'finished'
      : progress === 0 && task.status === 'todo'
        ? 'todo'
        : 'in-progress'

  return (
    <Modal title={`Update task · ${task.id}`} onClose={onClose} wide>
      <span
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${projectDetails.chip}`}
      >
        <Icon name={projectDetails.icon} className="h-3.5 w-3.5" />
        {task.project}
      </span>

      <h4 className="mt-3 text-lg font-bold leading-snug">{task.title}</h4>
      <p className="mt-2 text-sm leading-relaxed text-mute">
        {task.description}
      </p>

      <div className="mt-5 flex items-center justify-between text-sm">
        <span className="text-mute">Status</span>
        <StatusBadge status={previewStatus} />
      </div>

      <div className="mb-1 mt-4 flex justify-between text-sm">
        <span className="text-mute">Progress</span>
        <b className="text-brand">{progress}%</b>
      </div>

      <input
        type="range"
        min="0"
        max="100"
        step="5"
        value={progress}
        onChange={event => setProgress(Number(event.target.value))}
        className="mb-4 w-full accent-[#10e0a0]"
      />

      {progress === 100 && (
        <p className="mb-3 text-xs text-emerald-400">
          At 100% this deliverable will be marked Finished.
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={() => onSave(task, progress)}
        >
          Save
        </button>
      </div>
    </Modal>
  )
}

const DetailsModal = ({
  task,
  dev,
  isAdmin,
  onDelete,
  onClose,
}) => (
  <Modal title={`${task.id} · ${task.project}`} onClose={onClose} wide>
    <h4 className="text-xl font-bold">{task.title}</h4>

    <div className="my-3 flex flex-wrap items-center gap-3">
      <StatusBadge status={task.status} />
      <PriorityBadge priority={task.priority} />
      <span className="text-sm text-mute">Due {task.due}</span>
    </div>

    <p className="mb-4 text-sm leading-relaxed text-mute">
      {task.description || 'No description provided.'}
    </p>

    <div
      className="mb-4 h-2 rounded-full bg-app"
      role="progressbar"
      aria-valuenow={task.progress}
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div
        className="h-2 rounded-full bg-brand"
        style={{ width: `${task.progress}%` }}
      />
    </div>

    <div className="mb-5 flex items-center gap-3">
      <Avatar
        name={dev?.name || '?'}
        src={dev?.avatar}
        size="h-11 w-11"
      />
      <div>
        <p className="font-semibold">{dev?.name || 'Unassigned'}</p>
        <p className="text-xs text-mute">
          {dev?.role} · {task.progress}% complete
        </p>
      </div>
    </div>

    <div className="flex justify-between">
      {isAdmin ? (
        <button
          type="button"
          className="btn-ghost text-rose-400"
          onClick={() => onDelete(task)}
        >
          Delete
        </button>
      ) : (
        <span />
      )}

      <button type="button" className="btn-primary" onClick={onClose}>
        Close
      </button>
    </div>
  </Modal>
)

export {
  AssignModal,
  ReassignModal,
  StatusModal,
  UpdateModal,
  EmployeeUpdateModal,
  DetailsModal,
}
