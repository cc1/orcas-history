/**
 * Unified Autocomplete Component
 *
 * A configurable autocomplete that replaces AutocompleteField, FamilyLinksField,
 * and RelatedPagesField with a single, consistent implementation.
 */
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAutocomplete, type AutocompleteItem } from '@/hooks/useAutocomplete'
import { useEditableSection } from './EditableSection'

// ============================================================================
// Types
// ============================================================================

export interface AutocompleteOption extends AutocompleteItem {
  slug: string
  type?: string // For multi-type entities (person, place, topic)
}

interface UnifiedAutocompleteProps<T extends AutocompleteOption> {
  /** Available options to select from */
  options: T[]
  /** Currently selected items */
  value: T[]
  /** Callback when selection changes */
  onChange: (items: T[]) => void
  /** Allow multiple selections (default: true) */
  multiple?: boolean
  /** Field label (optional) */
  label?: string
  /** Placeholder text */
  placeholder?: string
  /** Empty state message */
  emptyMessage?: string
  /** Path prefix for links (e.g., '/people') */
  pathPrefix?: string | ((item: T) => string)
  /** Always show in edit mode (ignore EditableSection context) */
  alwaysEditable?: boolean
  /** Hide completely when empty and not editing */
  hideWhenEmpty?: boolean
  /** Custom option rendering */
  renderOption?: (item: T, isHighlighted: boolean) => React.ReactNode
  /** Custom chip/tag rendering for selected items */
  renderChip?: (item: T, onRemove: () => void) => React.ReactNode
  /** Custom display rendering for view mode */
  renderValue?: (items: T[]) => React.ReactNode
  /** Show as list instead of inline in view mode */
  displayAsList?: boolean
  /** Group items by type in display (for RelatedPages) */
  groupByType?: boolean
  /** Type labels for grouping */
  typeLabels?: Record<string, string>
  /** Type path prefixes for links */
  typePaths?: Record<string, string>
  /** Show saving indicator */
  isSaving?: boolean
}

// ============================================================================
// Sub-components
// ============================================================================

function RemoveButton({ onClick }: { onClick: () => void }): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-muted-foreground hover:text-foreground ml-1"
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  )
}

function DefaultChip<T extends AutocompleteOption>({
  item,
  onRemove,
  showType,
  typeLabels
}: {
  item: T
  onRemove: () => void
  showType?: boolean
  typeLabels?: Record<string, string>
}): React.ReactElement {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-sm">
      {showType && item.type && typeLabels && (
        <span className="text-xs text-muted-foreground">{typeLabels[item.type]}:</span>
      )}
      {item.label}
      <RemoveButton onClick={onRemove} />
    </span>
  )
}

function Dropdown<T extends AutocompleteOption>({
  items,
  highlightedIndex,
  onSelect,
  dropdownRef,
  renderOption,
  showType,
  typeLabels,
}: {
  items: T[]
  highlightedIndex: number
  onSelect: (item: T) => void
  dropdownRef: React.RefObject<HTMLDivElement | null>
  renderOption?: (item: T, isHighlighted: boolean) => React.ReactNode
  showType?: boolean
  typeLabels?: Record<string, string>
}): React.ReactElement | null {
  if (items.length === 0) return null

  return (
    <div
      ref={dropdownRef}
      className="absolute left-0 right-0 top-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto z-50"
    >
      {items.slice(0, 10).map((item, index) => {
        const isHighlighted = index === highlightedIndex

        if (renderOption) {
          return (
            <div key={item.id} onClick={() => onSelect(item)}>
              {renderOption(item, isHighlighted)}
            </div>
          )
        }

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            className={`w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 ${
              isHighlighted ? 'bg-muted' : ''
            }`}
          >
            {showType && item.type && typeLabels && (
              <span className="text-xs px-1.5 py-0.5 bg-secondary rounded text-muted-foreground">
                {typeLabels[item.type]}
              </span>
            )}
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function UnifiedAutocomplete<T extends AutocompleteOption>({
  options,
  value,
  onChange,
  multiple = true,
  label,
  placeholder = 'Search...',
  emptyMessage = '—',
  pathPrefix,
  alwaysEditable = false,
  hideWhenEmpty = false,
  renderOption,
  renderChip,
  renderValue,
  displayAsList = false,
  groupByType = false,
  typeLabels,
  typePaths,
  isSaving = false,
}: UnifiedAutocompleteProps<T>): React.ReactElement | null {
  const { isEditing: sectionEditing } = useEditableSection()
  const [isFieldEditing, setIsFieldEditing] = useState(alwaysEditable)
  const [localValue, setLocalValue] = useState<T[]>(value)

  // Sync local state with prop
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Reset field editing when section editing ends
  useEffect(() => {
    if (!alwaysEditable && !sectionEditing) {
      setIsFieldEditing(false)
    }
  }, [sectionEditing, alwaysEditable])

  const handleSelect = useCallback((item: T) => {
    const newItems = multiple ? [...localValue, item] : [item]
    setLocalValue(newItems)
    onChange(newItems)
    if (!multiple && !alwaysEditable) {
      setIsFieldEditing(false)
    }
  }, [localValue, multiple, alwaysEditable, onChange])

  const handleRemove = useCallback((item: T) => {
    const newItems = localValue.filter(v => v.id !== item.id)
    setLocalValue(newItems)
    onChange(newItems)
  }, [localValue, onChange])

  const autocomplete = useAutocomplete({
    items: options,
    selectedItems: localValue,
    onSelect: handleSelect,
    onRemove: handleRemove,
    multiple,
    alwaysEditable,
  })

  const isEditing = alwaysEditable || (sectionEditing && isFieldEditing)
  const showType = !!(groupByType && typeLabels)

  // Get path for a link
  const getPath = (item: T): string => {
    if (typeof pathPrefix === 'function') {
      return pathPrefix(item)
    }
    if (typePaths && item.type) {
      return `${typePaths[item.type]}/${item.slug}`
    }
    return `${pathPrefix}/${item.slug}`
  }

  // Hide when empty and not editing
  if (hideWhenEmpty && localValue.length === 0 && !sectionEditing) {
    return null
  }

  // Wrapper for labeled fields
  const wrapWithLabel = (content: React.ReactElement): React.ReactElement => {
    if (!label) return content
    return (
      <div className="mb-3">
        <h3 className="font-medium text-sm text-muted-foreground mb-1">{label}</h3>
        {content}
      </div>
    )
  }

  // ========== VIEW MODE ==========
  if (!isEditing) {
    // Section is editing but field is not - show clickable to enter edit mode
    if (sectionEditing) {
      return wrapWithLabel(
        <button
          onClick={() => setIsFieldEditing(true)}
          className="w-full text-left p-2 -m-2 rounded hover:bg-muted/50 transition-colors group"
        >
          {localValue.length > 0 ? (
            displayAsList ? (
              <ul className="space-y-1">
                {localValue.map(item => (
                  <li key={item.id} className="font-semibold text-primary">
                    {item.label}
                  </li>
                ))}
              </ul>
            ) : (
              <span>{localValue.map(s => s.label).join(', ')}</span>
            )
          ) : (
            <span className="text-muted-foreground italic">
              {placeholder || emptyMessage}
            </span>
          )}
          <span className="ml-2 opacity-0 group-hover:opacity-50 text-xs">
            {isSaving ? '(saving...)' : '(click to edit)'}
          </span>
        </button>
      )
    }

    // Pure view mode - show as links
    if (localValue.length === 0) {
      return wrapWithLabel(
        <span className="text-muted-foreground italic">{emptyMessage}</span>
      )
    }

    // Custom render
    if (renderValue) {
      return wrapWithLabel(<>{renderValue(localValue)}</>)
    }

    // Grouped display (for RelatedPages)
    if (groupByType && typeLabels && typePaths) {
      const grouped = localValue.reduce((acc, item) => {
        const type = item.type || 'other'
        if (!acc[type]) acc[type] = []
        acc[type].push(item)
        return acc
      }, {} as Record<string, T[]>)

      return wrapWithLabel(
        <div className="space-y-2">
          {Object.entries(typeLabels).map(([type, typeLabel]) => {
            const items = grouped[type]
            if (!items?.length) return null
            return (
              <div key={type}>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  {typeLabel}s:
                </span>{' '}
                {items.map((item, i) => (
                  <span key={item.id}>
                    {i > 0 && ', '}
                    <Link
                      to={getPath(item)}
                      className="font-semibold text-primary hover:underline"
                    >
                      {item.label}
                    </Link>
                  </span>
                ))}
              </div>
            )
          })}
        </div>
      )
    }

    // List display
    if (displayAsList) {
      return wrapWithLabel(
        <ul className="space-y-1">
          {localValue.map(item => (
            <li key={item.id}>
              {item.slug ? (
                <Link
                  to={getPath(item)}
                  className="font-semibold text-primary hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="font-semibold text-primary">{item.label}</span>
              )}
            </li>
          ))}
        </ul>
      )
    }

    // Inline display (default)
    return wrapWithLabel(
      <span>
        {localValue.map((item, index) => (
          <span key={item.id}>
            <Link
              to={getPath(item)}
              className="font-semibold text-primary hover:underline"
            >
              {item.label}
            </Link>
            {index < localValue.length - 1 && ', '}
          </span>
        ))}
      </span>
    )
  }

  // ========== EDIT MODE ==========
  return wrapWithLabel(
    <div className="relative">
      {/* Selected items as chips */}
      <div className="flex flex-wrap gap-1 p-2 -m-2 rounded border bg-background">
        {localValue.map(item => (
          renderChip ? (
            <span key={item.id}>
              {renderChip(item, () => handleRemove(item))}
            </span>
          ) : (
            <DefaultChip
              key={item.id}
              item={item}
              onRemove={() => handleRemove(item)}
              showType={showType}
              typeLabels={typeLabels}
            />
          )
        ))}

        {/* Search input */}
        <input
          ref={autocomplete.inputRef}
          type="text"
          value={autocomplete.searchText}
          onChange={autocomplete.handleInputChange}
          onFocus={autocomplete.handleInputFocus}
          onKeyDown={autocomplete.handleKeyDown}
          onBlur={autocomplete.handleInputBlur}
          placeholder={localValue.length === 0 ? placeholder : 'Add more...'}
          className="flex-1 min-w-[100px] outline-none bg-transparent text-sm"
        />
      </div>

      {/* Dropdown */}
      {autocomplete.showDropdown && (
        <Dropdown
          items={autocomplete.filteredItems}
          highlightedIndex={autocomplete.highlightedIndex}
          onSelect={autocomplete.handleSelect}
          dropdownRef={autocomplete.dropdownRef}
          renderOption={renderOption}
          showType={showType}
          typeLabels={typeLabels}
        />
      )}
    </div>
  )
}
