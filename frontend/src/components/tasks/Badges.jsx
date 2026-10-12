import { PRIORITY_META, STATUS_META } from '../../lib/tasks'

const StatusBadge = ({ status }) => {
  const statusDetails = STATUS_META[status]

  return (
    <span
      className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${statusDetails.badge}`}
    >
      {statusDetails.label}
    </span>
  )
}

const PriorityBadge = ({ priority }) => {
  const priorityDetails = PRIORITY_META[priority] || PRIORITY_META.medium

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${priorityDetails.text}`}
    >
      <span className={`h-2 w-2 rounded-full ${priorityDetails.dot}`} />
      {priorityDetails.label}
    </span>
  )
}

export { StatusBadge, PriorityBadge }
