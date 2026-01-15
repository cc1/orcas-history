import { useParams } from 'react-router-dom'
import { BacklinksSidebar } from '@/components/layout/BacklinksSidebar'
import { PhotoCarousel } from '@/components/media/PhotoCarousel'
import { usePersonBySlug } from '@/hooks/useData'

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

  return (
    <div className="container px-4 py-6">
      {/* Photo Carousel - First thing on the page */}
      {linkedPhotos.length > 0 && (
        <PhotoCarousel photos={linkedPhotos} title="Photos" />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">

          {/* Header */}
          <div>
            <h1 className="font-serif text-3xl font-bold">{person.displayName}</h1>
            {person.keyDatesText && (
              <p className="text-muted-foreground mt-1">{person.keyDatesText}</p>
            )}
          </div>

          {/* Connection to Pt. Lawrence */}
          {person.connectionToPtLawrence && (
            <section>
              <h2 className="font-serif text-xl font-semibold mb-3">Connection to Pt. Lawrence</h2>
              <p className="text-muted-foreground leading-relaxed">{person.connectionToPtLawrence}</p>
            </section>
          )}

          {/* Family */}
          {Object.keys(family).length > 0 && (
            <section>
              <h2 className="font-serif text-xl font-semibold mb-3">Family</h2>
              <div className="grid grid-cols-2 gap-4">
                {family.parents && family.parents.length > 0 && (
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Parents</h3>
                    <ul className="space-y-1">
                      {family.parents.map((name) => (
                        <li key={name} className="font-semibold text-primary hover:underline cursor-pointer">{name}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {family.spouses && family.spouses.length > 0 && (
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Spouse(s)</h3>
                    <ul className="space-y-1">
                      {family.spouses.map((name) => (
                        <li key={name} className="font-semibold text-primary hover:underline cursor-pointer">{name}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {family.children && family.children.length > 0 && (
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Children</h3>
                    <ul className="space-y-1">
                      {family.children.map((name) => (
                        <li key={name} className="font-semibold text-primary hover:underline cursor-pointer">{name}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {family.siblings && family.siblings.length > 0 && (
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Siblings</h3>
                    <ul className="space-y-1">
                      {family.siblings.map((name) => (
                        <li key={name} className="font-semibold text-primary hover:underline cursor-pointer">{name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Biography */}
          {person.biography && (
            <section>
              <h2 className="font-serif text-xl font-semibold mb-3">Biography</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{person.biography}</p>
            </section>
          )}

          {/* Timeline */}
          {timeline.length > 0 && (
            <section>
              <h2 className="font-serif text-xl font-semibold mb-3">Timeline</h2>
              <div className="timeline">
                {timeline.map((item, index) => (
                  <div key={index} className="timeline-item">
                    <div className="flex items-baseline gap-3 mb-1">
                      <span className="font-semibold">{item.year}</span>
                      {item.age !== undefined && (
                        <span className="text-sm text-muted-foreground">(Age {item.age})</span>
                      )}
                    </div>
                    <p className="text-muted-foreground">{item.event}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Miscellaneous */}
          {person.miscellaneous && (
            <section>
              <h2 className="font-serif text-xl font-semibold mb-3">Miscellaneous</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{person.miscellaneous}</p>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <BacklinksSidebar entityType="person" entityId={slug || ''} />
        </div>
      </div>
    </div>
  )
}
