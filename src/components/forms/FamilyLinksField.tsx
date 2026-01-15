/**
 * FamilyLinksField - Family relationship links (parents, spouses, children, siblings)
 *
 * Thin wrapper around UnifiedAutocomplete with backward compatibility
 * for string-based names transitioning to PersonLink objects.
 */
import { useCallback, useMemo, useState, useEffect } from 'react'
import { UnifiedAutocomplete, type AutocompleteOption } from './UnifiedAutocomplete'
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
  const [isSaving, setIsSaving] = useState(false)
  const { data: people } = usePeople()

  // Convert to AutocompleteOption format
  const options: AutocompleteOption[] = useMemo(() => {
    return (people || []).map(p => ({
      id: p.id,
      slug: p.slug,
      label: p.displayName,
    }))
  }, [people])

  // Convert string names to PersonLinks (backward compatibility)
  const normalizedValue: AutocompleteOption[] = useMemo(() => {
    if (!value || value.length === 0 || !people) return []

    return value.map(name => {
      // Try to find matching person in database
      const found = people.find(p =>
        p.displayName.toLowerCase() === name.toLowerCase() ||
        p.displayName.toLowerCase().includes(name.toLowerCase())
      )

      if (found) {
        return { id: found.id, slug: found.slug, label: found.displayName }
      }

      // Create placeholder for unmatched names
      return { id: '', slug: '', label: name }
    })
  }, [value, people])

  // Handle changes - convert back to PersonLink format
  const handleChange = useCallback(async (items: AutocompleteOption[]) => {
    setIsSaving(true)
    try {
      const links: PersonLink[] = items.map(item => ({
        id: item.id,
        slug: item.slug,
        name: item.label,
      }))
      await onSave(links)
    } finally {
      setIsSaving(false)
    }
  }, [onSave])

  return (
    <UnifiedAutocomplete
      options={options}
      value={normalizedValue}
      onChange={handleChange}
      multiple={true}
      label={label}
      placeholder={`Add ${label.toLowerCase()}...`}
      pathPrefix="/people"
      hideWhenEmpty={true}
      displayAsList={true}
      isSaving={isSaving}
    />
  )
}
