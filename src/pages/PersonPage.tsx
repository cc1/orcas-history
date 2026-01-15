import { useParams } from 'react-router-dom'
import { BacklinksSidebar } from '@/components/layout/BacklinksSidebar'
import { PhotoCarousel } from '@/components/media/PhotoCarousel'
import { InTheNews } from '@/components/entity/InTheNews'
import { EditableSection } from '@/components/forms/EditableSection'
import { EditableField } from '@/components/forms/EditableField'
import { MarkdownField } from '@/components/forms/MarkdownField'
import { FamilyLinksField } from '@/components/forms/FamilyLinksField'
import { usePersonBySlug } from '@/hooks/useData'
import { updatePersonField } from '@/lib/api'
import type { RelatedPage } from '@/lib/api'

interface PersonLink {
  id: string
  slug: string
  name: string
}

export function PersonPage(): React.ReactElement {
  const { slug } = useParams<{ slug: string }>()
  const { data: person, loading, error } = usePersonBySlug(slug || null)

  if (loading) {
    return (
      <div className="container px-4 py-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading person...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container px-4 py-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-destructive">Error loading person: {error.message}</div>
        </div>
      </div>
    )
  }

  if (!person) {
    return (
      <div className="container px-4 py-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Person not found</div>
        </div>
      </div>
    )
  }

  const family = person.familyData || {}
  const timeline = person.timeline || []
  const linkedPhotos = person.linkedPhotos || []
  const relatedPages = (person.relatedPages || []) as RelatedPage[]

  const handleSave = async (field: string, value: string) => {
    if (!slug) return
    try {
      await updatePersonField(slug, field, value)
    } catch (error) {
      console.error(`Failed to save ${field}:`, error)
    }
  }

  const handleSaveFamilyLinks = async (
    relationshipType: 'parents' | 'spouses' | 'children' | 'siblings',
    links: PersonLink[]
  ) => {
    if (!slug) return
    const updatedFamily = {
      ...family,
      [relationshipType]: links.map(l => l.name) // Store as names for now, can transition to IDs later
    }
    try {
      await updatePersonField(slug, 'familyData', updatedFamily)
    } catch (error) {
      console.error(`Failed to save family ${relationshipType}:`, error)
    }
  }

  const handleSaveRelatedPages = async (pages: RelatedPage[]) => {
    if (!slug) return
    try {
      await updatePersonField(slug, 'relatedPages', pages)
    } catch (error) {
      console.error('Failed to save related pages:', error)
    }
  }

  // Convert timeline array to markdown for editing
  const timelineMarkdown = timeline.map(item => {
    const ageText = item.age !== undefined ? ` (Age ${item.age})` : ''
    return `**${item.year}**${ageText}: ${item.event}`
  }).join('\n\n')

  const handleSaveTimeline = async (markdown: string) => {
    if (!slug) return
    // Parse markdown back to timeline array
    const lines = markdown.split('\n').filter(l => l.trim())
    const parsedTimeline = lines.map(line => {
      const match = line.match(/\*\*(\d+)\*\*(?:\s*\(Age\s*(\d+)\))?:\s*(.+)/)
      if (match) {
        return {
          year: parseInt(match[1]),
          age: match[2] ? parseInt(match[2]) : undefined,
          event: match[3].trim()
        }
      }
      // Fallback: try to parse year from beginning
      const yearMatch = line.match(/^(\d{4}):?\s*(.+)/)
      if (yearMatch) {
        return {
          year: parseInt(yearMatch[1]),
          event: yearMatch[2].trim()
        }
      }
      return null
    }).filter(Boolean)

    try {
      await updatePersonField(slug, 'timeline', parsedTimeline)
    } catch (error) {
      console.error('Failed to save timeline:', error)
    }
  }

  return (
    <div className="container px-4 py-6">
      {/* Photo Carousel - First thing on the page */}
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
                <label className="text-sm font-medium text-muted-foreground block mb-1">Key Dates</label>
                <EditableField
                  value={person.keyDatesText || ''}
                  onSave={(value) => handleSave('keyDatesText', value)}
                  placeholder="e.g., 1904-1995 (d. Age 91)"
                />
              </div>
            </div>

            {/* Connection to Pt. Lawrence */}
            <section className="mb-8">
              <h2 className="font-serif text-xl font-semibold mb-3">Connection to Pt. Lawrence</h2>
              <MarkdownField
                value={person.connectionToPtLawrence || ''}
                onSave={(value) => handleSave('connectionToPtLawrence', value)}
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
                  onSave={(links) => handleSaveFamilyLinks('parents', links)}
                />
                <FamilyLinksField
                  label="Spouse(s)"
                  value={family.spouses || []}
                  onSave={(links) => handleSaveFamilyLinks('spouses', links)}
                />
                <FamilyLinksField
                  label="Children"
                  value={family.children || []}
                  onSave={(links) => handleSaveFamilyLinks('children', links)}
                />
                <FamilyLinksField
                  label="Siblings"
                  value={family.siblings || []}
                  onSave={(links) => handleSaveFamilyLinks('siblings', links)}
                />
              </div>
            </section>

            {/* Biography */}
            <section className="mb-8">
              <h2 className="font-serif text-xl font-semibold mb-3">Biography</h2>
              <MarkdownField
                value={person.biography || ''}
                onSave={(value) => handleSave('biography', value)}
                placeholder="Write this person's biography..."
              />
            </section>

            {/* Timeline */}
            <section className="mb-8">
              <h2 className="font-serif text-xl font-semibold mb-3">Timeline</h2>
              <MarkdownField
                value={timelineMarkdown}
                onSave={handleSaveTimeline}
                placeholder="Format: **1940** (Age 36): Event description"
              />
            </section>

            {/* Miscellaneous */}
            <section className="mb-8">
              <h2 className="font-serif text-xl font-semibold mb-3">Miscellaneous</h2>
              <MarkdownField
                value={person.miscellaneous || ''}
                onSave={(value) => handleSave('miscellaneous', value)}
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
            onSaveRelatedPages={handleSaveRelatedPages}
          />
        </div>
      </div>
    </div>
  )
}
