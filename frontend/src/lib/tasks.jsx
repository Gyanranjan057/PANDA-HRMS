export const STATUS_ORDER = ['todo', 'in-progress', 'finished']

export const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'todo', label: 'To Do', icon: 'clipboard' },
  { id: 'in-progress', label: 'In Progress', icon: 'bolt' },
  { id: 'finished', label: 'Finished', icon: 'check' }
]

export const STATUS_META = {
  todo: {
    label: 'To Do',
    title: 'To Do Deliverables',
    desc: 'Deliverables waiting to be started',
    emptyText: 'There are currently no tasks waiting to start.',
    icon: 'clipboard',
    badge: 'border-amber-400/40 bg-amber-400/10 text-amber-400',
    text: 'text-amber-400',
    bar: 'bg-amber-400'
  },
  'in-progress': {
    label: 'In Progress',
    title: 'In Progress Deliverables',
    desc: 'Active engineering deliverables currently under execution',
    emptyText: 'There are currently no tasks under execution.',
    icon: 'bolt',
    badge: 'border-sky-400/40 bg-sky-400/10 text-sky-400',
    text: 'text-sky-400',
    bar: 'bg-sky-400'
  },
  finished: {
    label: 'Finished',
    title: 'Finished Deliverables',
    desc: 'Delivered and verified project work',
    emptyText: 'There are currently no completed tasks.',
    icon: 'check',
    badge: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-400',
    text: 'text-emerald-400',
    bar: 'bg-emerald-400'
  }
}

export const ALL_META = { title: 'All Project Deliverables', desc: 'Showing all deliverables across To Do, In Progress, and Finished stages', icon: 'grid' }

export const PRIORITY_META = {
  critical: { label: 'Critical', dot: 'bg-rose-500', text: 'text-rose-400' },
  high: { label: 'High', dot: 'bg-amber-400', text: 'text-amber-400' },
  medium: { label: 'Medium', dot: 'bg-emerald-400', text: 'text-emerald-400' },
  low: { label: 'Low', dot: 'bg-sky-400', text: 'text-sky-400' }
}

const DEFAULT_PROJECT = { icon: 'folder', chip: 'border-brand/50 bg-brand/10 text-brand' }

export const PROJECT_META = {}

export const projectMeta = (project) => PROJECT_META[project] || DEFAULT_PROJECT

export const filterTasksByStatus = (tasks, status) =>
  status === 'all' ? tasks : tasks.filter((task) => task.status === status)

export const searchTasks = (tasks, query, getDev) => {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return tasks

  return tasks.filter((task) =>
    [task.project, task.title, task.id, getDev(task.assignedTo)?.name || ''].some((value) =>
      value.toLowerCase().includes(normalizedQuery)
    )
  )
}

export const calculateTaskCounts = (tasks) => {
  const getProjectNames = (status) =>
    [...new Set(tasks.filter((task) => task.status === status).map((task) => task.project))].join(' & ')

  return {
    all: tasks.length,
    todo: tasks.filter((task) => task.status === 'todo').length,
    'in-progress': tasks.filter((task) => task.status === 'in-progress').length,
    finished: tasks.filter((task) => task.status === 'finished').length,
    projects: new Set(tasks.map((task) => task.project)).size,
    projectNames: {
      todo: getProjectNames('todo'),
      'in-progress': getProjectNames('in-progress'),
      finished: getProjectNames('finished')
    }
  }
}

export const groupByProject = (tasks) => {
  const map = new Map()
  tasks.forEach((task) => map.set(task.project, [...(map.get(task.project) || []), task]))
  return [...map.entries()].map(([project, items]) => ({ project, items }))
}

export const nextTaskId = (tasks) =>
  `TSK-${Math.max(0, ...tasks.map((task) => parseInt(task.id.split('-')[1], 10) || 0)) + 1}`

export const statusFromProgress = (progress, currentStatus) =>
  progress >= 100 ? 'finished' : progress === 0 && currentStatus === 'todo' ? 'todo' : 'in-progress'
