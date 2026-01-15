import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useEditableSection } from './EditableSection'
import { usePeople } from '@/hooks/useData'

interface PersonLink {
  id: string
  slug: string
  name: string
}

interface FamilyLinksFieldProps {
  label: string
  value: string[] // Currently stored as names, will transition to links
  onSave: (links: PersonLink[]) => Promise<void>
}

export function FamilyLinksField({ label, value, onSave }: FamilyLinksFieldProps): React.ReactElement | null {
  const { isEditing: sectionEditing } = useEditableSection()
  const [isFieldEditing, setIsFieldEditing] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [selectedItems, setSelectedItems] = useState<PersonLink[]>([])
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const { data: people } = usePeople()

  const isEditing = sectionEditing && isFieldEditing

  // Convert string names to PersonLinks on mount (for backward compatibility)
  useEffect(() => {
    if (value && value.length > 0 && people) {
      const links = value.map(name => {
        const found = people.find(p =>
          p.displayName.toLowerCase() === name.toLowerCase() ||
          p.displayName.toLowerCase().includes(name.toLowerCase())
        )
        if (found) {
          return { id: found.id, slug: found.slug, name: found.displayName }
        }
        // If not found in database, create a placeholder
        return { id: '', slug: '', name }
      })
      setSelectedItems(links)
    }
  }, [value, people])

  // Get available options
  const allOptions: PersonLink[] = (people || []).map(p => ({
    id: p.id,
    slug: p.slug,
    name: p.displayName
  }))

  // Filter options
  const filteredOptions = allOptions.filter(option => {
    if (selectedItems.some(s => s.id === option.id)) return false
    if (!searchText) return true
    return option.name.toLowerCase().includes(searchText.toLowerCase())
  })

  useEffect(() => {
    if (!sectionEditing) {
      setIsFieldEditing(false)
      setSearchText('')
    }
  }, [sectionEditing])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  useEffect(() => {
    setHighlightedIndex(0)
  }, [filteredOptions.length])

  const handleSave = useCallback(async (items: PersonLink[]) => {
    setIsSaving(true)
    try {
      await onSave(items)
    } finally {
      setIsSaving(false)
    }
  }, [onSave])

  const handleSelect = (option: PersonLink) => {
    const newItems = [...selectedItems, option]
    setSelectedItems(newItems)
    setSearchText('')
    handleSave(newItems)
  }

  const handleRemove = (itemToRemove: PersonLink) => {
    const newItems = selectedItems.filter(item =>
      item.id !== itemToRemove.id || item.name !== itemToRemove.name
    )
    setSelectedItems(newItems)
    handleSave(newItems)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => prev < filteredOptions.length - 1 ? prev + 1 : prev)
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
        setIsFieldEditing(false)
        setSearchText('')
        break
      case 'Backspace':
        if (!searchText && selectedItems.length > 0) {
          handleRemove(selectedItems[selectedItems.length - 1])
        }
        break
    }
  }

  // Don't render if no items and not editing
  if (!sectionEditing && selectedItems.length === 0) {
    return null
  }

  if (!isEditing) {
    if (sectionEditing) {
      return (
        <div className="mb-3">
          <h3 className="font-medium text-sm text-muted-foreground mb-1">{label}</h3>
          <button
            onClick={() => setIsFieldEditing(true)}
            className="w-full text-left p-2 -m-2 rounded hover:bg-muted/50 transition-colors group"
          >
            {selectedItems.length > 0 ? (
              <ul className="space-y-1">
                {selectedItems.map((item, idx) => (
                  <li key={idx} className="font-semibold text-primary">
                    {item.name}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-muted-foreground italic">Add {label.toLowerCase()}...</span>
            )}
            <span className="ml-2 opacity-0 group-hover:opacity-50 text-xs">
              {isSaving ? '(saving...)' : '(click to edit)'}
            </span>
          </button>
        </div>
      )
    }

    // Display mode - show as links
    return (
      <div className="mb-3">
        <h3 className="font-medium text-sm text-muted-foreground mb-1">{label}</h3>
        <ul className="space-y-1">
          {selectedItems.map((item, idx) => (
            <li key={idx}>
              {item.slug ? (
                <Link
                  to={`/people/${item.slug}`}
                  className="font-semibold text-primary hover:underline"
                >
                  {item.name}
                </Link>
              ) : (
                <span className="font-semibold text-primary">{item.name}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  // Edit mode
  return (
    <div className="mb-3">
      <h3 className="font-medium text-sm text-muted-foreground mb-1">{label}</h3>
      <div className="relative">
        <div className="flex flex-wrap gap-1 p-2 rounded border bg-background">
          {selectedItems.map((item, idx) => (
            <span
              key={idx}
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

          <input
            ref={inputRef}
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              setTimeout(() => {
                setIsFieldEditing(false)
                setSearchText('')
              }, 200)
            }}
            placeholder={selectedItems.length === 0 ? `Add ${label.toLowerCase()}...` : 'Add more...'}
            className="flex-1 min-w-[100px] outline-none bg-transparent text-sm"
          />
        </div>

        {searchText && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto z-50">
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
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No matches found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
