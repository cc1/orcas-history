/**
 * RelatedPagesField - Multi-type entity links (people, places, topics)
 *
 * Thin wrapper around UnifiedAutocomplete with grouped display.
 */
import { useCallback, useMemo } from 'react'
import { UnifiedAutocomplete, type AutocompleteOption } from './UnifiedAutocomplete'
import { useAllEntities } from '@/hooks/useData'
import type { RelatedPage } from '@/lib/api'

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

interface RelatedPagesFieldProps {
  value: RelatedPage[]
  onSave: (pages: RelatedPage[]) => void
}

export function RelatedPagesField({ value, onSave }: RelatedPagesFieldProps): React.ReactElement {
  const { data: allEntities } = useAllEntities()

  // Convert entities to AutocompleteOption format
  const options: AutocompleteOption[] = useMemo(() => {
    return (allEntities || []).map(entity => ({
      id: `${entity.type}-${entity.slug}`,
      slug: entity.slug,
      label: entity.name,
      type: entity.type,
    }))
  }, [allEntities])

  // Normalize value
  const normalizedValue: AutocompleteOption[] = useMemo(() => {
    return value.map(page => ({
      id: `${page.type}-${page.slug}`,
      slug: page.slug,
      label: page.name,
      type: page.type,
    }))
  }, [value])

  // Handle changes - convert back to RelatedPage format
  const handleChange = useCallback((items: AutocompleteOption[]) => {
    const pages: RelatedPage[] = items.map(item => ({
      type: item.type as 'person' | 'place' | 'topic',
      slug: item.slug,
      name: item.label,
    }))
    onSave(pages)
  }, [onSave])

  return (
    <UnifiedAutocomplete
      options={options}
      value={normalizedValue}
      onChange={handleChange}
      multiple={true}
      placeholder="Search for people, places, or topics..."
      emptyMessage="No related pages"
      groupByType={true}
      typeLabels={TYPE_LABELS}
      typePaths={TYPE_PATHS}
    />
  )
}
