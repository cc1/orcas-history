type SortOption = 'random' | 'year-asc' | 'year-desc'
type ShowFilter = 'all' | 'people' | 'places' | 'topics' | 'documents' | 'missingInfo'

interface FilterBarProps {
  sort: SortOption
  onSortChange: (sort: SortOption) => void
  showFilter: ShowFilter
  onShowFilterChange: (filter: ShowFilter) => void
  photoWidth: number
  onPhotoWidthChange: (width: number) => void
}

const showOptions: { value: ShowFilter; label: string }[] = [
  { value: 'all', label: 'All Photos' },
  { value: 'people', label: 'People' },
  { value: 'places', label: 'Places' },
  { value: 'topics', label: 'Topics' },
  { value: 'documents', label: 'Documents & Objects' },
  { value: 'missingInfo', label: 'Missing Information' },
]

// Zoom slider bounds
const MIN_WIDTH = 150
const MAX_WIDTH = 400

export function FilterBar({
  sort,
  onSortChange,
  showFilter,
  onShowFilterChange,
  photoWidth,
  onPhotoWidthChange,
}: FilterBarProps): React.ReactElement {
  return (
    <div className="sticky top-0 z-20 bg-background border-b">
      <div className="container px-4 py-3">
        <div className="flex flex-wrap items-center gap-4">
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

          {/* Show Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Show:</label>
            <select
              value={showFilter}
              onChange={(e) => onShowFilterChange(e.target.value as ShowFilter)}
              className="px-3 py-1.5 text-sm rounded-md border bg-background"
            >
              {showOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <label className="text-sm text-muted-foreground">Zoom:</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">−</span>
              <input
                type="range"
                min={MIN_WIDTH}
                max={MAX_WIDTH}
                value={photoWidth}
                onChange={(e) => onPhotoWidthChange(Number(e.target.value))}
                className="w-24 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <span className="text-xs text-muted-foreground">+</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
