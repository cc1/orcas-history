import { Link } from 'react-router-dom'
import { useRelatedPages } from '@/hooks/useData'

interface RelatedPagesSidebarProps {
  entityType: 'person' | 'place' | 'topic'
  entityId: string
}

export function BacklinksSidebar({ entityType, entityId }: RelatedPagesSidebarProps): React.ReactElement {
  const { data: relatedPages, loading } = useRelatedPages(entityType, entityId)

  if (loading) {
    return (
      <div className="sticky top-4">
        <div className="bg-card rounded-lg border p-4">
          <h3 className="font-semibold text-sm text-muted-foreground mb-3">Related Pages</h3>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  const hasRelatedPages = relatedPages && (
    relatedPages.people.length > 0 ||
    relatedPages.places.length > 0 ||
    relatedPages.topics.length > 0
  )

  if (!hasRelatedPages) {
    return (
      <div className="sticky top-4">
        <div className="bg-card rounded-lg border p-4">
          <h3 className="font-semibold text-sm text-muted-foreground mb-3">Related Pages</h3>
          <div className="text-sm text-muted-foreground">No related pages found</div>
        </div>
      </div>
    )
  }

  return (
    <div className="sticky top-4 space-y-6">
      <div className="bg-card rounded-lg border p-4">
        <h3 className="font-semibold text-sm text-muted-foreground mb-3">Related Pages</h3>

        {/* People */}
        {relatedPages.people.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
              People ({relatedPages.people.length})
            </h4>
            <div className="space-y-1">
              {relatedPages.people.map((person) => (
                <Link
                  key={person.slug}
                  to={`/people/${person.slug}`}
                  className="block text-sm font-semibold text-primary hover:underline"
                >
                  {person.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Places */}
        {relatedPages.places.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
              Places ({relatedPages.places.length})
            </h4>
            <div className="space-y-1">
              {relatedPages.places.map((place) => (
                <Link
                  key={place.slug}
                  to={`/places/${place.slug}`}
                  className="block text-sm font-semibold text-primary hover:underline"
                >
                  {place.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Topics */}
        {relatedPages.topics.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
              Topics ({relatedPages.topics.length})
            </h4>
            <div className="space-y-1">
              {relatedPages.topics.map((topic) => (
                <Link
                  key={topic.slug}
                  to={`/topics/${topic.slug}`}
                  className="block text-sm font-semibold text-primary hover:underline"
                >
                  {topic.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
