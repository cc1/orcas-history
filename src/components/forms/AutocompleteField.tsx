/**
 * AutocompleteField - Entity link autocomplete (people or places)
 *
 * Thin wrapper around UnifiedAutocomplete for backward compatibility.
 * Defers data fetching until user enters edit mode to improve page load performance.
 */
import { useCallback, useMemo, useState } from 'react'
import { UnifiedAutocomplete, type AutocompleteOption } from './UnifiedAutocomplete'
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
  const [isSaving, setIsSaving] = useState(false)
  const { isEditing } = useEditableSection()

  // Only fetch data when user is actually editing (or field is always editable)
  // This defers the API call until needed, improving initial page load
  const shouldFetch = alwaysEditable || isEditing
  const { data: people } = usePeople({ enabled: shouldFetch && type === 'people' })
  const { data: places } = usePlaces({ enabled: shouldFetch && type === 'place' })

  const isMultiple = type === 'people'
  const pathPrefix = type === 'people' ? '/people' : '/places'

  // Convert to AutocompleteOption format
  const options: AutocompleteOption[] = useMemo(() => {
    if (type === 'people') {
      return (people || []).map(p => ({
        id: p.id,
        slug: p.slug,
        label: p.displayName,
      }))
    }
    return (places || []).map(p => ({
      id: p.id,
      slug: p.slug,
      label: p.name,
    }))
  }, [type, people, places])

  // Normalize value to array format
  const normalizedValue: AutocompleteOption[] = useMemo(() => {
    if (!value) return []
    const arr = Array.isArray(value) ? value : [value]
    return arr.map(v => ({
      id: v.id,
      slug: v.slug,
      label: v.name,
    }))
  }, [value])

  // Handle changes - convert back to EntityLink format
  const handleChange = useCallback(async (items: AutocompleteOption[]) => {
    setIsSaving(true)
    try {
      const links: EntityLink[] = items.map(item => ({
        id: item.id,
        slug: item.slug,
        name: item.label,
      }))

      if (isMultiple) {
        await onSave(links)
      } else {
        await onSave(links.length > 0 ? links[0] : null)
      }
    } finally {
      setIsSaving(false)
    }
  }, [isMultiple, onSave])

  return (
    <UnifiedAutocomplete
      options={options}
      value={normalizedValue}
      onChange={handleChange}
      multiple={isMultiple}
      placeholder={placeholder}
      pathPrefix={pathPrefix}
      alwaysEditable={alwaysEditable}
      isSaving={isSaving}
    />
  )
}
