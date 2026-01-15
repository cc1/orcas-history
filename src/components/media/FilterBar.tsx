type SortOption = 'random' | 'year-asc' | 'year-desc'
type CategoryFilter = 'all' | 'people' | 'places' | 'topics' | 'documents'

interface Filters {
  category: CategoryFilter
  needsDate: boolean
}

interface FilterBarProps {
  sort: SortOption
  onSortChange: (sort: SortOption) => void
  filters: Filters
  onFiltersChange: (filters: Filters) => void
}

const categoryOptions: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'All Photos' },
  { value: 'people', label: 'People' },
  { value: 'places', label: 'Places' },
  { value: 'topics', label: 'Topics' },
  { value: 'documents', label: 'Documents & Objects' },
]

export function FilterBar({ sort, onSortChange, filters, onFiltersChange }: FilterBarProps): React.ReactElement {
  return (
    <div className="sticky top-0 z-20 bg-background border-b">
      <div className="container px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Sort:</label>
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="px-3 py-1.5 text-sm rounded-md border bg-background"
            >
              <option value="random">Shuffle</option>
              <option value="year-asc">Year (Oldest)</option>
              <option value="year-desc">Year (Newest)</option>
            </select>
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Category Toggle Buttons */}
          <div className="flex items-center gap-1">
            {categoryOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onFiltersChange({ ...filters, category: option.value })}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  filters.category === option.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Needs Date Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.needsDate}
              onChange={(e) => onFiltersChange({
                ...filters,
                needsDate: e.target.checked
              })}
              className="w-4 h-4 rounded border-muted"
            />
            <span className="text-sm">Needs Date</span>
          </label>
        </div>
      </div>
    </div>
  )
}
