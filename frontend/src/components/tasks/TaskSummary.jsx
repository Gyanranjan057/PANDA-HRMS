const SUMMARY_CARDS = [
  {
    id: 'all',
    label: 'Total Deliverables',
    valueColor: 'text-main',
    linkColor: 'text-brand',
    linkLabel: 'All →',
    description: counts => `Across ${counts.projects} Master Projects`,
    descriptionColor: 'text-brand',
  },
  {
    id: 'todo',
    label: 'To Do / Pending',
    valueColor: 'text-amber-400',
    linkColor: 'text-amber-400',
    description: counts => counts.projectNames.todo || 'Nothing waiting',
  },
  {
    id: 'in-progress',
    label: 'In Progress',
    valueColor: 'text-sky-400',
    linkColor: 'text-sky-400',
    description: counts =>
      counts.projectNames['in-progress'] || 'Nothing active',
  },
  {
    id: 'finished',
    label: 'Finished & Done',
    valueColor: 'text-emerald-400',
    linkColor: 'text-emerald-400',
    description: counts =>
      counts.projectNames.finished || 'Nothing completed',
  },
]

const TaskSummary = ({ counts, active, onSelect }) => (
  <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {SUMMARY_CARDS.map(card => {
      const isSelected = active === card.id
      const linkLabel = card.linkLabel || 'Only →'
      const descriptionColor = card.descriptionColor || 'text-mute'

      return (
        <button
          key={card.id}
          type="button"
          onClick={() => onSelect(card.id)}
          aria-pressed={isSelected}
          className={`panel p-5 text-left transition hover:-translate-y-0.5 hover:border-brand/50 ${
            isSelected ? '!border-brand/70' : ''
          }`}
        >
          <div className="flex items-start justify-between gap-2 text-sm font-medium text-mute">
            <span>{card.label}</span>
            <span className={`whitespace-nowrap font-semibold ${card.linkColor}`}>
              {linkLabel}
            </span>
          </div>

          <p className={`my-2 text-3xl font-bold ${card.valueColor}`}>
            {counts[card.id]}
          </p>

          <p className={`text-sm ${descriptionColor}`}>
            {card.description(counts)}
          </p>
        </button>
      )
    })}
  </div>
)

export default TaskSummary
