import TaskCard from './TaskCard'
import { projectMeta } from '../../lib/tasks'
import { Icon } from '../../ui'

const ProjectGroup = ({ project, items, ...handlers }) => {
  const projectDetails = projectMeta(project)
  const taskCountLabel = items.length === 1 ? 'task' : 'tasks'

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center gap-3 border-b border-line pb-2">
        <span className="text-brand">
          <Icon name={projectDetails.icon} className="h-5 w-5" />
        </span>
        <h3 className="text-base font-semibold">
          {project}
        </h3>
        <span className="rounded-full bg-card px-2 py-0.5 text-xs text-mute">
          {items.length} {taskCountLabel}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            dev={handlers.getDev(task.assignedTo)}
            isAdmin={handlers.isAdmin}
            onView={() => handlers.open('view', task)}
            onReassign={() => handlers.open('reassign', task)}
            onProgress={() => handlers.onSetStatus(task, 'in-progress')}
            onFinish={() => handlers.onSetStatus(task, 'finished')}
          />
        ))}
      </div>
    </section>
  )
}

export default ProjectGroup
