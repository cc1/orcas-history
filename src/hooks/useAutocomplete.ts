/**
 * Shared hook for autocomplete functionality
 * Handles state management, keyboard navigation, and filtering
 */
import { useState, useRef, useEffect, useCallback, useMemo } from 'react'

export interface AutocompleteItem {
  id: string
  label: string
  [key: string]: unknown
}

interface UseAutocompleteOptions<T extends AutocompleteItem> {
  items: T[]
  selectedItems: T[]
  onSelect: (item: T) => void
  onRemove: (item: T) => void
  getItemId?: (item: T) => string
  multiple?: boolean
  alwaysEditable?: boolean
}

interface UseAutocompleteReturn<T extends AutocompleteItem> {
  // State
  searchText: string
  setSearchText: (text: string) => void
  showDropdown: boolean
  setShowDropdown: (show: boolean) => void
  highlightedIndex: number
  setHighlightedIndex: (index: number) => void

  // Computed
  filteredItems: T[]

  // Refs
  inputRef: React.RefObject<HTMLInputElement | null>
  dropdownRef: React.RefObject<HTMLDivElement | null>

  // Handlers
  handleKeyDown: (e: React.KeyboardEvent) => void
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleInputFocus: () => void
  handleInputBlur: () => void
  handleSelect: (item: T) => void
  handleRemove: (item: T) => void
}

export function useAutocomplete<T extends AutocompleteItem>({
  items,
  selectedItems,
  onSelect,
  onRemove,
  getItemId = (item) => item.id,
  multiple = true,
  alwaysEditable = false,
}: UseAutocompleteOptions<T>): UseAutocompleteReturn<T> {
  const [searchText, setSearchText] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Build Set of selected IDs for O(1) lookup instead of O(n) Array.some()
  const selectedIds = useMemo(
    () => new Set(selectedItems.map(s => getItemId(s))),
    [selectedItems, getItemId]
  )

  // Filter items based on search and exclude selected
  const filteredItems = useMemo(() => {
    const lowerSearch = searchText.toLowerCase()
    return items.filter(item => {
      if (selectedIds.has(getItemId(item))) return false
      if (!searchText) return true
      return item.label.toLowerCase().includes(lowerSearch)
    })
  }, [items, selectedIds, searchText, getItemId])

  // Reset highlighted index when filtered items change
  useEffect(() => {
    setHighlightedIndex(0)
  }, [filteredItems.length])

  const handleSelect = useCallback((item: T) => {
    onSelect(item)
    setSearchText('')
    if (!multiple && !alwaysEditable) {
      setShowDropdown(false)
    }
  }, [onSelect, multiple, alwaysEditable])

  const handleRemove = useCallback((item: T) => {
    onRemove(item)
  }, [onRemove])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (!showDropdown && filteredItems.length > 0) {
          setShowDropdown(true)
        } else {
          setHighlightedIndex(prev =>
            prev < filteredItems.length - 1 ? prev + 1 : prev
          )
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0)
        break
      case 'Enter':
        e.preventDefault()
        if (filteredItems[highlightedIndex]) {
          handleSelect(filteredItems[highlightedIndex])
        }
        break
      case 'Escape':
        setShowDropdown(false)
        setSearchText('')
        break
      case 'Backspace':
        if (!searchText && selectedItems.length > 0 && multiple) {
          handleRemove(selectedItems[selectedItems.length - 1])
        }
        break
    }
  }, [showDropdown, filteredItems, highlightedIndex, searchText, selectedItems, multiple, handleSelect, handleRemove])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value)
    setShowDropdown(true)
  }, [])

  const handleInputFocus = useCallback(() => {
    setShowDropdown(true)
  }, [])

  const handleInputBlur = useCallback(() => {
    // Delay to allow click events on dropdown items
    setTimeout(() => {
      setShowDropdown(false)
      if (!alwaysEditable) {
        setSearchText('')
      }
    }, 200)
  }, [alwaysEditable])

  return {
    searchText,
    setSearchText,
    showDropdown,
    setShowDropdown,
    highlightedIndex,
    setHighlightedIndex,
    filteredItems,
    inputRef,
    dropdownRef,
    handleKeyDown,
    handleInputChange,
    handleInputFocus,
    handleInputBlur,
    handleSelect,
    handleRemove,
  }
}
