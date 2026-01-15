import { Link } from 'react-router-dom'

interface BacklinksSidebarProps {
  entityType: 'person' | 'place' | 'topic'
  entityId: string
}

// Mock backlinks data - will be fetched from API
const mockBacklinks = {
  photos: [
    { id: '0001', imageUrl: 'https://picsum.photos/seed/bl1/100/75', title: 'Photo #0001' },
    { id: '0015', imageUrl: 'https://picsum.photos/seed/bl2/100/75', title: 'Photo #0015' },
    { id: '0042', imageUrl: 'https://picsum.photos/seed/bl3/100/75', title: 'Photo #0042' },
  ],
  news: [
    { id: '1895-07-001', year: 1895, month: 'July', snippet: 'Leslie Darwin and Lew Berens brought Mr. and Mrs. O. H. Culver...' },
    { id: '1901-08-001', year: 1901, month: 'August', snippet: 'Mr. and Mrs. Craft visited the fish trap at Point Lawrence...' },
  ],
  people: [
    { slug: 'culver-ken', name: 'Ken Culver' },
    { slug: 'culver-jean-roethenhoefer', name: 'Jean Culver' },
  ],
  places: [
    { slug: 'pt-lawrence-lodge', name: 'Point Lawrence Lodge' },
  ],
  topics: [
    { slug: 'fish-traps', name: 'Fish Traps' },
    { slug: 'fishing-derbies', name: 'Fishing Derbies' },
  ],
}

export function BacklinksSidebar({ entityType, entityId }: BacklinksSidebarProps): React.ReactElement {
  // In production, fetch backlinks based on entityType and entityId
  const backlinks = mockBacklinks

  return (
    <div className="sticky top-4 space-y-6">
      <div className="bg-card rounded-lg border p-4">
        <h3 className="font-semibold text-sm text-muted-foreground mb-3">Linked Mentions</h3>

        {/* Photos */}
        {backlinks.photos.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
              Photos ({backlinks.photos.length})
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {backlinks.photos.map((photo) => (
                <Link
                  key={photo.id}
                  to={`/photos/${photo.id}`}
                  className="aspect-square rounded overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                >
                  <img
                    src={photo.imageUrl}
                    alt={photo.title}
                    className="w-full h-full object-cover"
                  />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* News */}
        {backlinks.news.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
              News ({backlinks.news.length})
            </h4>
            <div className="space-y-2">
              {backlinks.news.map((item) => (
                <Link
                  key={item.id}
                  to="/news"
                  className="block p-2 rounded bg-muted/50 hover:bg-muted transition-colors"
                >
                  <span className="text-xs font-medium text-primary">
                    {item.month} {item.year}
                  </span>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {item.snippet}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* People (if not on a person page) */}
        {entityType !== 'person' && backlinks.people.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
              People ({backlinks.people.length})
            </h4>
            <div className="space-y-1">
              {backlinks.people.map((person) => (
                <Link
                  key={person.slug}
                  to={`/people/${person.slug}`}
                  className="block text-sm text-primary hover:underline"
                >
                  {person.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Places (if not on a place page) */}
        {entityType !== 'place' && backlinks.places.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
              Places ({backlinks.places.length})
            </h4>
            <div className="space-y-1">
              {backlinks.places.map((place) => (
                <Link
                  key={place.slug}
                  to={`/places/${place.slug}`}
                  className="block text-sm text-primary hover:underline"
                >
                  {place.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Topics (if not on a topic page) */}
        {entityType !== 'topic' && backlinks.topics.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
              Topics ({backlinks.topics.length})
            </h4>
            <div className="space-y-1">
              {backlinks.topics.map((topic) => (
                <Link
                  key={topic.slug}
                  to={`/topics/${topic.slug}`}
                  className="block text-sm text-primary hover:underline"
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
