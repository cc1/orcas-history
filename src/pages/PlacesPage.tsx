import { useState, useMemo } from 'react'
import { EntityGallery } from '@/components/entity/EntityGallery'
import { PlacesMap } from '@/components/map/PlacesMap'
import { usePlaces } from '@/hooks/useData'

type ViewMode = 'gallery' | 'map'

export function PlacesPage(): React.ReactElement {
  const [viewMode, setViewMode] = useState<ViewMode>('gallery')
  const { data: places, loading, error } = usePlaces()

  // Transform API data to match component expectations
  const transformedPlaces = useMemo(() => {
    if (!places) return []

    return places.map(place => ({
      id: place.id,
      slug: place.slug,
      name: place.name,
      imageUrl: place.imageUrl || undefined, // No placeholder - show initial instead
      lat: place.latitude ? parseFloat(place.latitude) : undefined,
      lng: place.longitude ? parseFloat(place.longitude) : undefined,
    }))
  }, [places])

  // Filter places with valid coordinates for the map
  const placesWithCoords = transformedPlaces
    .filter((p): p is typeof p & { lat: number; lng: number } => p.lat !== undefined && p.lng !== undefined)

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

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading places...</div>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center py-12">
          <div className="text-destructive">Error loading places: {error.message}</div>
        </div>
      )}

      {!loading && !error && transformedPlaces.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">No places found</div>
        </div>
      )}

      {!loading && !error && transformedPlaces.length > 0 && (
        viewMode === 'gallery' ? (
          <EntityGallery
            entities={transformedPlaces}
            basePath="/places"
          />
        ) : (
          <PlacesMap places={placesWithCoords} />
        )
      )}
    </div>
  )
}
