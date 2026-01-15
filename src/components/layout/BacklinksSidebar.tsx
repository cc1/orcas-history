/**
 * Sidebar showing linked mentions (backlinks) and user-editable related pages
 */
import { Link } from 'react-router-dom'
import { useLinkedMentions } from '@/hooks/useData'
import { EditableSection } from '@/components/forms/EditableSection'
import { RelatedPagesField } from '@/components/forms/RelatedPagesField'
import type { RelatedPage } from '@/lib/api'

// Entity type configuration for rendering mentions
const ENTITY_CONFIG = [
  { key: 'people', label: 'People', path: '/people' },
  { key: 'places', label: 'Places', path: '/places' },
  { key: 'topics', label: 'Topics', path: '/topics' },
] as const

interface BacklinksSidebarProps {
  entityType: 'person' | 'place' | 'topic'
  entityId: string
  relatedPages: RelatedPage[]
  onSaveRelatedPages: (pages: RelatedPage[]) => void
}

export function BacklinksSidebar({
  entityType,
  entityId,
  relatedPages,
  onSaveRelatedPages,
}: BacklinksSidebarProps): React.ReactElement {
  const { data: linkedMentions, loading } = useLinkedMentions(entityType, entityId)

  const hasLinkedMentions = linkedMentions && (
    linkedMentions.people.length > 0 ||
    linkedMentions.places.length > 0 ||
    linkedMentions.topics.length > 0
  )

  return (
    <div className="sticky top-4 space-y-6">
      {/* Linked Mentions Section (Read-Only) */}
      <div className="bg-card rounded-lg border p-4">
        <h3 className="font-semibold text-sm text-muted-foreground mb-3">Linked Mentions</h3>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : !hasLinkedMentions ? (
          <div className="text-sm text-muted-foreground italic">
            No pages link to this page yet
          </div>
        ) : (
          <div className="space-y-4">
            {ENTITY_CONFIG.map(({ key, label, path }) => {
              const items = linkedMentions[key]
              if (items.length === 0) return null
              return (
                <div key={key}>
                  <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                    {label} ({items.length})
                  </h4>
                  <div className="space-y-1">
                    {items.map((item) => (
                      <Link
                        key={item.slug}
                        to={`${path}/${item.slug}`}
                        className="block text-sm font-semibold text-primary hover:underline"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Related Pages Section (User-Editable) */}
      <div className="bg-card rounded-lg border p-4">
        <h3 className="font-semibold text-sm text-muted-foreground mb-3">Related Pages</h3>
        <EditableSection>
          <RelatedPagesField
            value={relatedPages}
            onSave={onSaveRelatedPages}
          />
        </EditableSection>
      </div>
    </div>
  )
}
