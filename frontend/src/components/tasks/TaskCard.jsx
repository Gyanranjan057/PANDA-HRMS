
import { Avatar, Icon } from '../../ui'
import { projectMeta, STATUS_META } from '../../lib/tasks'

const TaskCard = ({
  task,
  dev,
  isAdmin,
  onView,
  onUpdate,
  onReassign,
  onDone,
  onPending,
}) => {
  const project = projectMeta(task.project)
  const status = STATUS_META[task.status]
  const isFinished = task.status === 'finished'
  const isTodo = task.status === 'todo'

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
        <div className="mb-1.5 flex justify-between text-xs">
          <span className="text-mute">Progress</span>
          <span className={`font-semibold ${status.text}`}>
            {task.progress}%
          </span>
        </div>

        <div
          className="h-2 rounded-full bg-app"
          role="progressbar"
          aria-valuenow={task.progress}
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              isFinished ? 'bg-emerald-400' : 'bg-brand'
            }`}
            style={{ width: `${task.progress}%` }}
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

        {isAdmin && (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={onDone}
              disabled={isFinished}
              className={`btn-ghost !px-4 !py-2 !border-brand/50 text-brand disabled:cursor-default ${
                isFinished ? 'bg-brand/10' : ''
              }`}
            >
              Done
            </button>

            <button
              type="button"
              onClick={onPending}
              disabled={isTodo}
              className={`btn-ghost !px-4 !py-2 !border-amber-400/50 text-amber-400 disabled:cursor-default ${
                isTodo ? 'bg-amber-400/10' : ''
              }`}
            >
              Pending
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-3">
        {isAdmin ? (
          <button
            type="button"
            onClick={isFinished ? onView : onReassign}
            className="btn-ghost flex-1 justify-center"
          >
            {isFinished ? 'View' : 'Reassign Dev'}
          </button>
        ) : (
          <button
            type="button"
            onClick={onUpdate}
            disabled={isFinished}
            className="btn-ghost flex-1 justify-center !border-brand/60 text-brand disabled:cursor-default disabled:!border-emerald-400/40 disabled:text-emerald-400"
          >
            {isFinished && <Icon name="check" className="h-4 w-4" />}
            {isFinished ? 'Completed' : 'Update'}
            {!isFinished && (
              <Icon name="arrowRight" className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </article>
  )
}

export default TaskCard
