import { useMemo } from 'react'
import { EntityGallery } from '@/components/entity/EntityGallery'
import { usePeople } from '@/hooks/useData'

export function PeoplePage(): React.ReactElement {
  const { data: people, loading, error } = usePeople()

  // Transform API data to match EntityGallery expectations
  const transformedPeople = useMemo(() => {
    if (!people) return []

    return people.map(person => ({
      id: person.id,
      slug: person.slug,
      name: person.displayName,
      imageUrl: person.imageUrl || undefined, // No placeholder - show initial instead
      subtitle: person.keyDatesText || undefined,
    }))
  }, [people])

  return (
    <div className="container px-4 py-6">
      <h1 className="font-serif text-2xl font-bold mb-6">People</h1>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading people...</div>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center py-12">
          <div className="text-destructive">Error loading people: {error.message}</div>
        </div>
      )}

      {!loading && !error && transformedPeople.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">No people found</div>
        </div>
      )}

      {!loading && !error && transformedPeople.length > 0 && (
        <EntityGallery
          entities={transformedPeople}
          basePath="/people"
        />
      )}
    </div>
  )
}
