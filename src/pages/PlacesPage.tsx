import { useState } from 'react'
import { EntityGallery } from '@/components/entity/EntityGallery'
import { PlacesMap } from '@/components/map/PlacesMap'

// Mock data - will be replaced with actual data fetching
const mockPlaces = [
  { id: '1', slug: 'pt-lawrence-lodge', name: 'Point Lawrence Lodge', imageUrl: 'https://picsum.photos/seed/pl1/400/300', lat: 48.6789, lng: -122.7456 },
  { id: '2', slug: 'alderbrook-farm', name: 'Alderbrook Farm', imageUrl: 'https://picsum.photos/seed/pl2/400/300', lat: 48.6700, lng: -122.8234 },
  { id: '3', slug: 'doe-bay', name: 'Doe Bay', imageUrl: 'https://picsum.photos/seed/pl3/400/300', lat: 48.6631, lng: -122.7972 },
  { id: '4', slug: 'mt-constitution', name: 'Mt. Constitution', imageUrl: 'https://picsum.photos/seed/pl4/400/300', lat: 48.6803, lng: -122.8317 },
  { id: '5', slug: 'olga', name: 'Olga', imageUrl: 'https://picsum.photos/seed/pl5/400/300', lat: 48.6256, lng: -122.8186 },
  { id: '6', slug: 'olga-cemetery', name: 'Olga Cemetery', imageUrl: 'https://picsum.photos/seed/pl6/400/300', lat: 48.6280, lng: -122.8150 },
  { id: '7', slug: 'blakely-mill', name: 'Blakely Mill', imageUrl: 'https://picsum.photos/seed/pl7/400/300', lat: 48.5800, lng: -122.8100 },
  { id: '8', slug: 'sea-acres', name: 'Sea Acres', imageUrl: 'https://picsum.photos/seed/pl8/400/300', lat: 48.6500, lng: -122.7800 },
  { id: '9', slug: 'shorewood', name: 'Shorewood', imageUrl: 'https://picsum.photos/seed/pl9/400/300', lat: 48.6600, lng: -122.7700 },
]

type ViewMode = 'gallery' | 'map'

export function PlacesPage(): React.ReactElement {
  const [viewMode, setViewMode] = useState<ViewMode>('gallery')

  return (
    <div className="container px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold">Places</h1>
        <div className="flex rounded-md border overflow-hidden">
          <button
            onClick={() => setViewMode('gallery')}
            className={`px-4 py-2 text-sm font-medium ${
              viewMode === 'gallery'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background hover:bg-muted'
            }`}
          >
            Gallery
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-4 py-2 text-sm font-medium ${
              viewMode === 'map'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background hover:bg-muted'
            }`}
          >
            Map
          </button>
        </div>
      </div>

      {viewMode === 'gallery' ? (
        <EntityGallery
          entities={mockPlaces}
          basePath="/places"
        />
      ) : (
        <PlacesMap places={mockPlaces} />
      )}
    </div>
  )
}
