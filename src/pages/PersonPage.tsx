import { useParams } from 'react-router-dom'
import { BacklinksSidebar } from '@/components/layout/BacklinksSidebar'
import { PhotoCarousel } from '@/components/media/PhotoCarousel'
import { InTheNews } from '@/components/entity/InTheNews'
import { EditableSection } from '@/components/forms/EditableSection'
import { EditableField } from '@/components/forms/EditableField'
import { MarkdownField } from '@/components/forms/MarkdownField'
import { FamilyLinksField } from '@/components/forms/FamilyLinksField'
import { usePersonBySlug } from '@/hooks/useData'
import { usePersonForm } from '@/hooks/usePersonForm'
import { timelineToMarkdown } from '@/lib/timeline'
import type { RelatedPage } from '@/lib/api'

// ============================================================================
// Loading/Error States
// ============================================================================

function LoadingState(): React.ReactElement {
  return (
    <div className="container px-4 py-6">
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading person...</div>
      </div>
    </div>
  )
}

function ErrorState({ message }: { message: string }): React.ReactElement {
  return (
    <div className="container px-4 py-6">
      <div className="flex items-center justify-center py-12">
        <div className="text-destructive">Error loading person: {message}</div>
      </div>
    </div>
  )
}

function NotFoundState(): React.ReactElement {
  return (
    <div className="container px-4 py-6">
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Person not found</div>
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function PersonPage(): React.ReactElement {
  const { slug } = useParams<{ slug: string }>()
  const { data: person, loading, error } = usePersonBySlug(slug || null)

  const family = person?.familyData || {}
  const { saveField, saveFamilyLinks, saveRelatedPages, saveTimeline } = usePersonForm({
    slug,
    familyData: family,
  })

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error.message} />
  if (!person) return <NotFoundState />

  const timeline = person.timeline || []
  const linkedPhotos = person.linkedPhotos || []
  const relatedPages = (person.relatedPages || []) as RelatedPage[]
  const timelineMarkdown = timelineToMarkdown(timeline)

  return (
    <div className="container px-4 py-6">
      {/* Photo Carousel */}
      {linkedPhotos.length > 0 && (
        <PhotoCarousel photos={linkedPhotos} title="Photos" />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <EditableSection>
            {/* Header */}
            <div className="mb-8">
              <h1 className="font-serif text-3xl font-bold">{person.displayName}</h1>
              <div className="mt-2">
                <label className="text-sm font-medium text-muted-foreground block mb-1">
                  Key Dates
                </label>
                <EditableField
                  value={person.keyDatesText || ''}
                  onSave={(value) => saveField('keyDatesText', value)}
                  placeholder="e.g., 1904-1995 (d. Age 91)"
                />
              </div>
            </div>

            {/* Connection to Pt. Lawrence */}
            <section className="mb-8">
              <h2 className="font-serif text-xl font-semibold mb-3">
                Connection to Pt. Lawrence
              </h2>
              <MarkdownField
                value={person.connectionToPtLawrence || ''}
                onSave={(value) => saveField('connectionToPtLawrence', value)}
                placeholder="Describe this person's connection to Point Lawrence..."
              />
            </section>

            {/* Family */}
            <section className="mb-8">
              <h2 className="font-serif text-xl font-semibold mb-3">Family</h2>
              <div className="grid grid-cols-2 gap-4">
                <FamilyLinksField
                  label="Parents"
                  value={family.parents || []}
                  onSave={(links) => saveFamilyLinks('parents', links)}
                />
                <FamilyLinksField
                  label="Spouse(s)"
                  value={family.spouses || []}
                  onSave={(links) => saveFamilyLinks('spouses', links)}
                />
                <FamilyLinksField
                  label="Children"
                  value={family.children || []}
                  onSave={(links) => saveFamilyLinks('children', links)}
                />
                <FamilyLinksField
                  label="Siblings"
                  value={family.siblings || []}
                  onSave={(links) => saveFamilyLinks('siblings', links)}
                />
              </div>
            </section>

            {/* Biography */}
            <section className="mb-8">
              <h2 className="font-serif text-xl font-semibold mb-3">Biography</h2>
              <MarkdownField
                value={person.biography || ''}
                onSave={(value) => saveField('biography', value)}
                placeholder="Write this person's biography..."
              />
            </section>

            {/* Timeline */}
            <section className="mb-8">
              <h2 className="font-serif text-xl font-semibold mb-3">Timeline</h2>
              <MarkdownField
                value={timelineMarkdown}
                onSave={saveTimeline}
                placeholder="Format: **1940** (Age 36): Event description"
              />
            </section>

            {/* Miscellaneous */}
            <section className="mb-8">
              <h2 className="font-serif text-xl font-semibold mb-3">Miscellaneous</h2>
              <MarkdownField
                value={person.miscellaneous || ''}
                onSave={(value) => saveField('miscellaneous', value)}
                placeholder="Additional notes and information..."
              />
            </section>
          </EditableSection>

          {/* In the News */}
          <InTheNews entityType="person" slug={slug || ''} />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <BacklinksSidebar
            entityType="person"
            entityId={slug || ''}
            relatedPages={relatedPages}
            onSaveRelatedPages={saveRelatedPages}
          />
        </div>
      </div>
    </div>
  )
}
