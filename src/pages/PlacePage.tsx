import { useParams } from 'react-router-dom'
import { BacklinksSidebar } from '@/components/layout/BacklinksSidebar'
import { PhotoCarousel } from '@/components/media/PhotoCarousel'
import { usePlaceBySlug } from '@/hooks/useData'

export function PlacePage(): React.ReactElement {
  const { slug } = useParams<{ slug: string }>()
  const { data: place, loading, error } = usePlaceBySlug(slug || null)

  if (loading) {
    return (
      <div className="container px-4 py-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading place...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container px-4 py-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-destructive">Error loading place: {error.message}</div>
        </div>
      </div>
    )
  }

  if (!place) {
    return (
      <div className="container px-4 py-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Place not found</div>
        </div>
      </div>
    )
  }

  const sections = (place.contentSections || []) as Array<{ heading: string; content: string }>
  const researchQuestions = (place.researchQuestions || []) as string[]
  const lat = place.latitude ? parseFloat(place.latitude) : null
  const lng = place.longitude ? parseFloat(place.longitude) : null
  const linkedPhotos = place.linkedPhotos || []

  return (
    <div className="container px-4 py-6">
      {/* Photo Carousel - First thing on the page */}
      {linkedPhotos.length > 0 && (
        <PhotoCarousel photos={linkedPhotos} title="Photos" />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hero Image (only show if no carousel) */}
          {linkedPhotos.length === 0 && place.imageUrl && (
            <div className="aspect-video rounded-lg overflow-hidden bg-muted">
              <img
                src={place.imageUrl}
                alt={place.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Header */}
          <div>
            <h1 className="font-serif text-3xl font-bold">{place.name}</h1>
            {lat && lng && (
              <p className="text-muted-foreground mt-1 text-sm">
                {lat.toFixed(4)}, {lng.toFixed(4)}
              </p>
            )}
          </div>

          {/* Description */}
          {place.description && (
            <section>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{place.description}</p>
            </section>
          )}

          {/* Content Sections */}
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-serif text-xl font-semibold mb-3">{section.heading}</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{section.content}</p>
            </section>
          ))}

          {/* Research Questions */}
          {researchQuestions.length > 0 && (
            <section>
              <h2 className="font-serif text-xl font-semibold mb-3">Research Questions</h2>
              <ul className="space-y-2">
                {researchQuestions.map((question, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary">?</span>
                    <span className="text-muted-foreground">{question}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <BacklinksSidebar entityType="place" entityId={slug || ''} />
        </div>
      </div>
    </div>
  )
}
