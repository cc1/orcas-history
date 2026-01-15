type SortOption = 'random' | 'year-asc' | 'year-desc'

interface Filters {
  people: string[]
  places: string[]
  showDocuments: boolean
  needsDate: boolean
}

interface FilterBarProps {
  sort: SortOption
  onSortChange: (sort: SortOption) => void
  filters: Filters
  onFiltersChange: (filters: Filters) => void
}

// Mock data for filter options - will be fetched from API
const mockPeopleOptions = ['Ken Culver', 'Carroll Culver', 'O.H. Culver', 'Jean Culver']
const mockPlacesOptions = ['Point Lawrence Lodge', 'Alderbrook Farm', 'Doe Bay', 'Olga']

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
              <option value="random">Random</option>
              <option value="year-asc">Year (Oldest First)</option>
              <option value="year-desc">Year (Newest First)</option>
            </select>
          </div>

          <div className="h-6 w-px bg-border" />

          {/* People Filter */}
          <select
            value={filters.people[0] || ''}
            onChange={(e) => onFiltersChange({
              ...filters,
              people: e.target.value ? [e.target.value] : []
            })}
            className="px-3 py-1.5 text-sm rounded-md border bg-background"
          >
            <option value="">All People</option>
            {mockPeopleOptions.map(person => (
              <option key={person} value={person}>{person}</option>
            ))}
          </select>

          {/* Places Filter */}
          <select
            value={filters.places[0] || ''}
            onChange={(e) => onFiltersChange({
              ...filters,
              places: e.target.value ? [e.target.value] : []
            })}
            className="px-3 py-1.5 text-sm rounded-md border bg-background"
          >
            <option value="">All Places</option>
            {mockPlacesOptions.map(place => (
              <option key={place} value={place}>{place}</option>
            ))}
          </select>

          <div className="h-6 w-px bg-border" />

          {/* Documents Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.showDocuments}
              onChange={(e) => onFiltersChange({
                ...filters,
                showDocuments: e.target.checked
              })}
              className="w-4 h-4 rounded border-muted"
            />
            <span className="text-sm">Documents Only</span>
          </label>

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

          {/* Clear Filters */}
          {(filters.people.length > 0 || filters.places.length > 0 || filters.showDocuments || filters.needsDate) && (
            <button
              onClick={() => onFiltersChange({
                people: [],
                places: [],
                showDocuments: false,
                needsDate: false,
              })}
              className="text-sm text-primary hover:underline"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
