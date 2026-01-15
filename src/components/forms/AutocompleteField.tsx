import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useEditableSection } from './EditableSection'
import { usePeople, usePlaces } from '@/hooks/useData'

interface EntityLink {
  id: string
  slug: string
  name: string
}

interface AutocompleteFieldProps {
  type: 'people' | 'place'
  value: EntityLink[] | EntityLink | null
  onSave: (links: EntityLink[] | EntityLink | null) => Promise<void>
  placeholder?: string
  /** When true, field is always editable without requiring EditableSection */
  alwaysEditable?: boolean
}

export function AutocompleteField({
  type,
  value,
  onSave,
  placeholder,
  alwaysEditable
}: AutocompleteFieldProps): React.ReactElement {
  const { isEditing: sectionEditing } = useEditableSection()
  const [isFieldEditing, setIsFieldEditing] = useState(alwaysEditable || false)
  const [searchText, setSearchText] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedItems, setSelectedItems] = useState<EntityLink[]>(() => {
    if (!value) return []
    return Array.isArray(value) ? value : [value]
  })
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch data based on type
  const { data: people } = usePeople()
  const { data: places } = usePlaces()

  // In alwaysEditable mode, component is always ready to edit
  const isEditing = alwaysEditable || (sectionEditing && isFieldEditing)
  const isMultiple = type === 'people'

  // Get available options based on type
  const allOptions: EntityLink[] = type === 'people'
    ? (people || []).map(p => ({ id: p.id, slug: p.slug, name: p.displayName }))
    : (places || []).map(p => ({ id: p.id, slug: p.slug, name: p.name }))

  // Filter options based on search text
  const filteredOptions = allOptions.filter(option => {
    // Don't show already selected items
    if (selectedItems.some(s => s.id === option.id)) return false

    if (!searchText) return true
    return option.name.toLowerCase().includes(searchText.toLowerCase())
  })

  // Update selected items when value prop changes
  useEffect(() => {
    if (!value) {
      setSelectedItems([])
    } else if (Array.isArray(value)) {
      setSelectedItems(value)
    } else {
      setSelectedItems([value])
    }
  }, [value])

  // Reset field editing when section editing ends (skip in alwaysEditable mode)
  useEffect(() => {
    if (!alwaysEditable && !sectionEditing) {
      setIsFieldEditing(false)
      setSearchText('')
    }
  }, [sectionEditing, alwaysEditable])

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  // Reset highlighted index when filtered options change
  useEffect(() => {
    setHighlightedIndex(0)
  }, [filteredOptions.length])

  const handleSave = useCallback(async (items: EntityLink[]) => {
    setIsSaving(true)
    try {
      if (isMultiple) {
        await onSave(items)
      } else {
        await onSave(items.length > 0 ? items[0] : null)
      }
    } finally {
      setIsSaving(false)
    }
  }, [isMultiple, onSave])

  const handleSelect = (option: EntityLink) => {
    const newItems = isMultiple
      ? [...selectedItems, option]
      : [option]

    setSelectedItems(newItems)
    setSearchText('')
    handleSave(newItems)

    // In alwaysEditable mode, keep field open; otherwise close after single selection
    if (!isMultiple && !alwaysEditable) {
      setIsFieldEditing(false)
    }
  }

  const handleRemove = (itemToRemove: EntityLink) => {
    const newItems = selectedItems.filter(item => item.id !== itemToRemove.id)
    setSelectedItems(newItems)
    handleSave(newItems)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0)
        break
      case 'Enter':
        e.preventDefault()
        if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex])
        }
        break
      case 'Escape':
        // In alwaysEditable mode, just clear search; otherwise close field
        if (!alwaysEditable) {
          setIsFieldEditing(false)
        }
        setSearchText('')
        break
      case 'Backspace':
        if (!searchText && selectedItems.length > 0) {
          handleRemove(selectedItems[selectedItems.length - 1])
        }
        break
    }
  }

  // Get the path prefix for links based on type
  const pathPrefix = type === 'people' ? '/people' : '/places'

  if (!isEditing) {
    // In edit mode for section, show clickable edit interface
    if (sectionEditing) {
      return (
        <button
          onClick={() => setIsFieldEditing(true)}
          className="w-full text-left p-2 -m-2 rounded hover:bg-muted/50 transition-colors group"
        >
          <span className={selectedItems.length === 0 ? 'text-muted-foreground italic' : ''}>
            {selectedItems.length > 0
              ? selectedItems.map(s => s.name).join(', ')
              : placeholder || '—'}
          </span>
          <span className="ml-2 opacity-0 group-hover:opacity-50 text-xs">
            {isSaving ? '(saving...)' : '(click to edit)'}
          </span>
        </button>
      )
    }

    // Not editing - show as clickable links
    if (selectedItems.length === 0) {
      return (
        <span className="text-muted-foreground italic">
          {placeholder || '—'}
        </span>
      )
    }

    return (
      <span>
        {selectedItems.map((item, index) => (
          <span key={item.id}>
            <Link
              to={`${pathPrefix}/${item.slug}`}
              className="font-semibold text-primary hover:underline"
            >
              {item.name}
            </Link>
            {index < selectedItems.length - 1 && ', '}
          </span>
        ))}
      </span>
    )
  }

  return (
    <div className="relative">
      {/* Selected items as tags */}
      <div className="flex flex-wrap gap-1 p-2 -m-2 rounded border bg-background">
        {selectedItems.map(item => (
          <span
            key={item.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-sm"
          >
            {item.name}
            <button
              onClick={() => handleRemove(item)}
              className="text-muted-foreground hover:text-foreground"
              type="button"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}

        {/* Search input */}
        <input
          ref={inputRef}
          type="text"
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value)
            setShowDropdown(true)
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            // Delay to allow click events on dropdown
            setTimeout(() => {
              // In alwaysEditable mode, just clear search; otherwise close field
              if (!alwaysEditable) {
                setIsFieldEditing(false)
              }
              setSearchText('')
              setShowDropdown(false)
            }, 200)
          }}
          placeholder={selectedItems.length === 0 ? placeholder : 'Add more...'}
          className="flex-1 min-w-[100px] outline-none bg-transparent text-sm"
        />
      </div>

      {/* Dropdown - only show when focused/typing */}
      {showDropdown && filteredOptions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 top-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto z-50"
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.slice(0, 10).map((option, index) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-muted ${
                  index === highlightedIndex ? 'bg-muted' : ''
                }`}
              >
                {option.name}
              </button>
            ))
          ) : searchText ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No matches found
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
