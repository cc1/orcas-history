/**
 * Autocomplete field for related pages that works with all entity types (people, places, topics)
 */
import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useEditableSection } from './EditableSection'
import { useAllEntities } from '@/hooks/useData'
import type { RelatedPage, Entity } from '@/lib/api'

interface RelatedPagesFieldProps {
  value: RelatedPage[]
  onSave: (pages: RelatedPage[]) => void
}

const TYPE_LABELS: Record<string, string> = {
  person: 'Person',
  place: 'Place',
  topic: 'Topic',
}

const TYPE_PATHS: Record<string, string> = {
  person: '/people',
  place: '/places',
  topic: '/topics',
}

export function RelatedPagesField({ value, onSave }: RelatedPagesFieldProps): React.ReactElement {
  const { isEditing } = useEditableSection()
  const { data: allEntities } = useAllEntities()
  const [selectedPages, setSelectedPages] = useState<RelatedPage[]>(value)
  const [inputValue, setInputValue] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Sync with prop changes
  useEffect(() => {
    setSelectedPages(value)
  }, [value])

  // Filter entities based on input and exclude already selected
  const filteredEntities = (allEntities || []).filter(entity => {
    const isSelected = selectedPages.some(p => p.type === entity.type && p.slug === entity.slug)
    const matchesSearch = entity.name.toLowerCase().includes(inputValue.toLowerCase())
    return !isSelected && matchesSearch
  })

  // Reset highlight when filtered results change
  useEffect(() => {
    setHighlightedIndex(0)
  }, [filteredEntities.length])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (entity: Entity) => {
    const newPage: RelatedPage = {
      type: entity.type,
      slug: entity.slug,
      name: entity.name,
    }
    const newPages = [...selectedPages, newPage]
    setSelectedPages(newPages)
    onSave(newPages)
    setInputValue('')
    setShowDropdown(false)
    inputRef.current?.focus()
  }

  const handleRemove = (index: number) => {
    const newPages = selectedPages.filter((_, i) => i !== index)
    setSelectedPages(newPages)
    onSave(newPages)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || filteredEntities.length === 0) {
      if (e.key === 'ArrowDown' && filteredEntities.length > 0) {
        setShowDropdown(true)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(i => Math.min(i + 1, filteredEntities.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(i => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (filteredEntities[highlightedIndex]) {
          handleSelect(filteredEntities[highlightedIndex])
        }
        break
      case 'Escape':
        setShowDropdown(false)
        break
    }
  }

  // Display mode - show as links grouped by type
  if (!isEditing) {
    if (selectedPages.length === 0) {
      return <span className="text-muted-foreground italic">No related pages</span>
    }

    // Group by type
    const groupedPages = selectedPages.reduce((acc, page) => {
      if (!acc[page.type]) acc[page.type] = []
      acc[page.type].push(page)
      return acc
    }, {} as Record<string, RelatedPage[]>)

    return (
      <div className="space-y-2">
        {(['person', 'place', 'topic'] as const).map(type => {
          const pages = groupedPages[type]
          if (!pages?.length) return null
          return (
            <div key={type}>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                {TYPE_LABELS[type]}s:
              </span>{' '}
              {pages.map((page, i) => (
                <span key={page.slug}>
                  {i > 0 && ', '}
                  <Link
                    to={`${TYPE_PATHS[page.type]}/${page.slug}`}
                    className="font-semibold text-primary hover:underline"
                  >
                    {page.name}
                  </Link>
                </span>
              ))}
            </div>
          )
        })}
      </div>
    )
  }

  // Edit mode - show autocomplete with selected chips
  return (
    <div className="space-y-2">
      {/* Selected pages as removable chips */}
      {selectedPages.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedPages.map((page, index) => (
            <span
              key={`${page.type}-${page.slug}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full text-sm"
            >
              <span className="text-xs text-muted-foreground">{TYPE_LABELS[page.type]}:</span>
              {page.name}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Autocomplete input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={e => {
            setInputValue(e.target.value)
            setShowDropdown(true)
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search for people, places, or topics..."
          className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />

        {/* Dropdown */}
        {showDropdown && filteredEntities.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto"
          >
            {filteredEntities.slice(0, 20).map((entity, index) => (
              <button
                key={`${entity.type}-${entity.slug}`}
                type="button"
                onClick={() => handleSelect(entity)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 ${
                  index === highlightedIndex ? 'bg-accent' : ''
                }`}
              >
                <span className="text-xs px-1.5 py-0.5 bg-secondary rounded text-muted-foreground">
                  {TYPE_LABELS[entity.type]}
                </span>
                {entity.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
