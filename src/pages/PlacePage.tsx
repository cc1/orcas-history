import { useParams } from 'react-router-dom'
import { BacklinksSidebar } from '@/components/layout/BacklinksSidebar'

// Mock data - will be replaced with actual data fetching
const mockPlace = {
  slug: 'pt-lawrence-lodge',
  name: 'Point Lawrence Lodge',
  imageUrl: 'https://picsum.photos/seed/place1/800/600',
  latitude: 48.6789,
  longitude: -122.7456,
  sections: [
    {
      heading: 'History',
      content: 'Point Lawrence Lodge was established in the 1930s by Carroll Culver as a fishing resort. Located on the eastern tip of Orcas Island, it became a popular destination for anglers from across the Pacific Northwest.',
    },
    {
      heading: 'The Lodge Building',
      content: 'The main lodge building was constructed in 1930 and featured a large common room, kitchen, and several guest rooms. The structure was designed to withstand the harsh marine environment while providing comfort to visitors.',
    },
    {
      heading: 'The Dock',
      content: 'The dock at Point Lawrence was essential for the lodge\'s operation, providing access for guests arriving by boat and serving as the launching point for fishing expeditions.',
    },
  ],
  researchQuestions: [
    'When was the dock originally built?',
    'What happened to the original lodge building?',
    'Who were the regular visitors to the lodge?',
  ],
}

export function PlacePage(): React.ReactElement {
  const { slug } = useParams<{ slug: string }>()

  // In production, fetch place data based on slug
  const place = mockPlace

  return (
    <div className="container px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hero Image */}
          <div className="aspect-video rounded-lg overflow-hidden bg-muted">
            <img
              src={place.imageUrl}
              alt={place.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Header */}
          <div>
            <h1 className="font-serif text-3xl font-bold">{place.name}</h1>
            {place.latitude && place.longitude && (
              <p className="text-muted-foreground mt-1 text-sm">
                {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
              </p>
            )}
          </div>

          {/* Content Sections */}
          {place.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-serif text-xl font-semibold mb-3">{section.heading}</h2>
              <p className="text-muted-foreground leading-relaxed">{section.content}</p>
            </section>
          ))}

          {/* Research Questions */}
          {place.researchQuestions.length > 0 && (
            <section>
              <h2 className="font-serif text-xl font-semibold mb-3">Research Questions</h2>
              <ul className="space-y-2">
                {place.researchQuestions.map((question, i) => (
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
