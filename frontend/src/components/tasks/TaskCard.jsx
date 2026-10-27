
import { Avatar, Icon } from '../../ui'
import { projectMeta } from '../../lib/tasks'
import { StatusBadge } from './Badges'

const TaskCard = ({
  task,
  dev,
  isAdmin,
  onView,
  onReassign,
  onProgress,
  onFinish,
}) => {
  const project = projectMeta(task.project)
  const isFinished = task.status === 'finished'
  const progress = Math.max(0, Math.min(100, Number(task.progress || 0)))

  return (
    <article className="panel flex flex-col p-5 transition duration-200 hover:-translate-y-0.5 hover:border-brand/40">
      <span
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${project.chip}`}
      >
        <Icon name={project.icon} className="h-3.5 w-3.5" />
        {task.project}
      </span>

      <div className="mt-4 flex items-start gap-4">
        <span className="whitespace-nowrap pt-1.5 font-mono text-xs font-medium text-mute">
          {task.id}
        </span>

        <button
          type="button"
          onClick={onView}
          className="text-left text-lg font-bold leading-snug transition hover:text-brand"
        >
          {task.title}
        </button>
      </div>

      <p className="mt-2 flex-1 text-sm leading-relaxed text-mute">
        {task.description}
      </p>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <StatusBadge status={task.status} />
          <span className="text-xs font-semibold text-mute">{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-line">
          <div
            className={`h-full rounded-full transition-all ${task.status === 'finished' ? 'bg-emerald-400' : task.status === 'in-progress' ? 'bg-sky-400' : 'bg-amber-400'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div
        className={`mt-4 flex items-center gap-3 border-t border-line pt-4 ${
          isAdmin ? 'justify-between' : ''
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Avatar
            name={dev?.name || '?'}
            src={dev?.avatar}
            size="h-10 w-10"
          />

          <div className="min-w-0">
            <p className="text-xs text-mute">Assigned to</p>
            <p className="truncate text-sm font-semibold">
              {dev?.name || 'Unassigned'}
            </p>
            <p className="truncate text-xs text-mute">{dev?.role}</p>
          </div>
        </div>

        {!isAdmin && (
          <div className="flex shrink-0 gap-2">
            {task.status === 'todo' && (
              <button type="button" onClick={onProgress} className="btn-ghost !border-sky-400/50 !px-3 !py-2 text-sky-400">
                Start
              </button>
            )}
            {task.status !== 'finished' && (
              <button type="button" onClick={onFinish} className="btn-ghost !border-brand/50 !px-3 !py-2 text-brand">
                Finish
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={!isAdmin || isFinished ? onView : onReassign}
          className="btn-ghost flex-1 justify-center"
        >
          {!isAdmin || isFinished ? 'View Details' : 'Reassign Dev'}
        </button>
      </div>
    </article>
  )
}

export default TaskCard
