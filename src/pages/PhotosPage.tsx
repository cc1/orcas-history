import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { MasonryGrid } from '@/components/media/MasonryGrid'
import { FilterBar } from '@/components/media/FilterBar'
import { PhotoModal } from '@/components/media/PhotoModal'
import { useMedia } from '@/hooks/useData'

type SortOption = 'random' | 'year-asc' | 'year-desc'
type CategoryFilter = 'all' | 'people' | 'places' | 'topics' | 'documents'

interface Filters {
  category: CategoryFilter
  needsDate: boolean
}

export function PhotosPage(): React.ReactElement {
  const navigate = useNavigate()
  const [sort, setSort] = useState<SortOption>('random')
  const [filters, setFilters] = useState<Filters>({
    category: 'all',
    needsDate: false,
  })
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)

  // Fetch photos from API based on category filter
  const { data: photos, loading, error } = useMedia({
    category: filters.category === 'documents' ? 'document' : filters.category === 'all' ? undefined : undefined,
    sort: sort,
    needsDate: filters.needsDate || undefined,
    limit: 500,
    // TODO: Add people/places/topics filtering when API supports it
  })

  // Transform API data to match component expectations
  const transformedPhotos = useMemo(() => {
    if (!photos) return []

    return photos.map(photo => ({
      id: photo.number,
      imageUrl: photo.webImagePath || photo.googleUrl || '',
      date: photo.dateOriginalText || 'TBD',
      location: photo.locationText || '',
      people: '', // TODO: Fetch linked people
      description: photo.description || '',
      source: photo.sourceText || '',
      type: photo.category,
      hasHighRes: photo.hasHighRes,
      notes: photo.notes,
    }))
  }, [photos])

  const handlePhotoClick = (photoId: string): void => {
    const index = transformedPhotos.findIndex(p => p.id === photoId)
    if (index !== -1) {
      setSelectedPhotoIndex(index)
    }
  }

  const handleCloseModal = useCallback(() => {
    setSelectedPhotoIndex(null)
  }, [])

  const handleNavigate = useCallback((direction: 'prev' | 'next') => {
    if (selectedPhotoIndex === null) return
    const newIndex = direction === 'prev'
      ? (selectedPhotoIndex - 1 + transformedPhotos.length) % transformedPhotos.length
      : (selectedPhotoIndex + 1) % transformedPhotos.length
    setSelectedPhotoIndex(newIndex)
  }, [selectedPhotoIndex, transformedPhotos.length])

  const handleOpenPage = useCallback(() => {
    if (selectedPhotoIndex !== null) {
      const photo = transformedPhotos[selectedPhotoIndex]
      setSelectedPhotoIndex(null)
      navigate(`/photos/${photo.id}`)
    }
  }, [selectedPhotoIndex, transformedPhotos, navigate])

  const selectedPhoto = selectedPhotoIndex !== null ? transformedPhotos[selectedPhotoIndex] : null

  return (
    <div className="min-h-screen">
      <FilterBar
        sort={sort}
        onSortChange={setSort}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <div className="container px-4 py-6">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading photos...</div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-12">
            <div className="text-destructive">Error loading photos: {error.message}</div>
          </div>
        )}

        {!loading && !error && transformedPhotos.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">No photos found</div>
          </div>
        )}

        {!loading && !error && transformedPhotos.length > 0 && (
          <MasonryGrid
            photos={transformedPhotos}
            onPhotoClick={handlePhotoClick}
          />
        )}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          onClose={handleCloseModal}
          onNavigate={handleNavigate}
          onOpenPage={handleOpenPage}
        />
      )}
    </div>
  )
}
