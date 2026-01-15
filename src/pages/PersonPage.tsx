import { useParams } from 'react-router-dom'
import { BacklinksSidebar } from '@/components/layout/BacklinksSidebar'

// Mock data - will be replaced with actual data fetching
const mockPerson = {
  slug: 'culver-carroll-nelson',
  displayName: 'Carroll Nelson Culver',
  keyDates: '1904-1995',
  imageUrl: 'https://picsum.photos/seed/person1/800/600',
  connectionToPtLawrence: 'Carroll Culver built and ran Point Lawrence Lodge, a fishing resort on the eastern tip of Orcas Island. He spent most of his adult life there, raising his family and hosting visitors from across the Pacific Northwest.',
  family: {
    parents: ['Otis Henry Culver', 'Mabel Gertrude Smith'],
    spouses: ['Jean Roethenhoefer Culver'],
    children: ['Ken Culver', 'Bruce Culver', 'Carolyn Culver Leonhardt'],
    siblings: ['Evelyn Louise Culver', 'Leda Gertrude Culver'],
  },
  biography: 'Carroll Nelson Culver was born on April 7, 1904, in New Whatcom, Washington. He grew up in a family deeply connected to the fishing industry and maritime life of the Pacific Northwest...',
  timeline: [
    { year: 1904, age: 0, event: 'Born April 07, 1904 in New Whatcom, WA' },
    { year: 1926, age: 22, event: 'Married Jean Roethenhoefer' },
    { year: 1930, age: 26, event: 'Began construction of Point Lawrence Lodge' },
    { year: 1995, age: 91, event: 'Passed away' },
  ],
}

export function PersonPage(): React.ReactElement {
  const { slug } = useParams<{ slug: string }>()

  // In production, fetch person data based on slug
  const person = mockPerson

  return (
    <div className="container px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hero Image */}
          <div className="aspect-video rounded-lg overflow-hidden bg-muted">
            <img
              src={person.imageUrl}
              alt={person.displayName}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Header */}
          <div>
            <h1 className="font-serif text-3xl font-bold">{person.displayName}</h1>
            <p className="text-muted-foreground mt-1">{person.keyDates}</p>
          </div>

          {/* Connection to Pt. Lawrence */}
          <section>
            <h2 className="font-serif text-xl font-semibold mb-3">Connection to Pt. Lawrence</h2>
            <p className="text-muted-foreground leading-relaxed">{person.connectionToPtLawrence}</p>
          </section>

          {/* Family */}
          <section>
            <h2 className="font-serif text-xl font-semibold mb-3">Family</h2>
            <div className="grid grid-cols-2 gap-4">
              {person.family.parents.length > 0 && (
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Parents</h3>
                  <ul className="space-y-1">
                    {person.family.parents.map((name) => (
                      <li key={name} className="text-primary hover:underline cursor-pointer">{name}</li>
                    ))}
                  </ul>
                </div>
              )}
              {person.family.spouses.length > 0 && (
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Spouse(s)</h3>
                  <ul className="space-y-1">
                    {person.family.spouses.map((name) => (
                      <li key={name} className="text-primary hover:underline cursor-pointer">{name}</li>
                    ))}
                  </ul>
                </div>
              )}
              {person.family.children.length > 0 && (
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Children</h3>
                  <ul className="space-y-1">
                    {person.family.children.map((name) => (
                      <li key={name} className="text-primary hover:underline cursor-pointer">{name}</li>
                    ))}
                  </ul>
                </div>
              )}
              {person.family.siblings.length > 0 && (
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Siblings</h3>
                  <ul className="space-y-1">
                    {person.family.siblings.map((name) => (
                      <li key={name} className="text-primary hover:underline cursor-pointer">{name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>

          {/* Biography */}
          <section>
            <h2 className="font-serif text-xl font-semibold mb-3">Biography</h2>
            <p className="text-muted-foreground leading-relaxed">{person.biography}</p>
          </section>

          {/* Timeline */}
          <section>
            <h2 className="font-serif text-xl font-semibold mb-3">Timeline</h2>
            <div className="timeline">
              {person.timeline.map((item) => (
                <div key={item.year} className="timeline-item">
                  <div className="flex items-baseline gap-3 mb-1">
                    <span className="font-semibold">{item.year}</span>
                    <span className="text-sm text-muted-foreground">(Age {item.age})</span>
                  </div>
                  <p className="text-muted-foreground">{item.event}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <BacklinksSidebar entityType="person" entityId={slug || ''} />
        </div>
      </div>
    </div>
  )
}
