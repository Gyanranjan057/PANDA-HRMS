import { FILTERS } from '../../lib/tasks'
import { Icon } from '../../ui'

const TaskFilters = ({ status, counts, onChange }) => (
  <div
    className="panel mb-6 flex flex-wrap items-center gap-x-5 gap-y-3 p-5"
    role="tablist"
    aria-label="Filter deliverables by status"
  >
    <span className="flex items-center gap-3 text-sm text-mute">
      <Icon name="filter" className="h-5 w-5 text-brand" />
      Filter Deliverables:
    </span>

    <span className="text-sm font-semibold">Status</span>

    <div className="flex flex-wrap gap-2">
      {FILTERS.map(filter => {
        const isSelected = status === filter.id

        return (
          <button
            key={filter.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(filter.id)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              isSelected
                ? 'border-brand bg-brand/10 text-brand'
                : 'border-line bg-app hover:border-brand/40'
            }`}
          >
            {filter.icon && <Icon name={filter.icon} className="h-4 w-4" />}
            {filter.label}
            <span className="rounded-full bg-black/20 px-1.5 text-xs text-mute">
              {counts[filter.id]}
            </span>
          </button>
        )
      })}
    </div>
  </div>
)

export default TaskFilters
