import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MasonryGrid } from '@/components/media/MasonryGrid'
import { FilterBar } from '@/components/media/FilterBar'
import { PhotoModal } from '@/components/media/PhotoModal'
import { useInfiniteMedia } from '@/hooks/useData'
import { getImageUrl } from '@/lib/utils'

type SortOption = 'random' | 'year-asc' | 'year-desc'
type ShowFilter = 'all' | 'people' | 'places' | 'topics' | 'documents' | 'missingInfo'

const PHOTO_WIDTH_KEY = 'orcas-photo-width'
const DEFAULT_PHOTO_WIDTH = 280

function getInitialPhotoWidth(): number {
  if (typeof window === 'undefined') return DEFAULT_PHOTO_WIDTH
  const stored = localStorage.getItem(PHOTO_WIDTH_KEY)
  if (stored) {
    const parsed = parseInt(stored, 10)
    if (!isNaN(parsed) && parsed >= 150 && parsed <= 400) {
      return parsed
    }
  }
  return DEFAULT_PHOTO_WIDTH
}

export function PhotosPage(): React.ReactElement {
  const navigate = useNavigate()
  const [sort, setSort] = useState<SortOption>('random')
  const [showFilter, setShowFilter] = useState<ShowFilter>('all')
  const [photoWidth, setPhotoWidth] = useState(getInitialPhotoWidth)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)

  // Persist photo width to localStorage
  useEffect(() => {
    localStorage.setItem(PHOTO_WIDTH_KEY, String(photoWidth))
  }, [photoWidth])

  // Map showFilter to API params
  const apiParams = useMemo(() => {
    const params: {
      category?: 'photo' | 'document'
      missingInfo?: boolean
    } = {}

    if (showFilter === 'documents') {
      params.category = 'document'
    } else if (showFilter === 'missingInfo') {
      params.missingInfo = true
    }
    // people, places, topics filters not yet implemented in API
    // they would filter by linked entities

    return params
  }, [showFilter])

  // Fetch photos from API with infinite scroll
  const { data: photos, loading, loadingMore, error, hasMore, loadMore } = useInfiniteMedia({
    ...apiParams,
    sort: sort,
    pageSize: 40,
  })

  // Transform API data to match component expectations
  const transformedPhotos = useMemo(() => {
    if (!photos) return []

    return photos.map(photo => ({
      id: photo.number,
      imageUrl: getImageUrl(photo.webImagePath, photo.googleUrl),
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

  // Apply photo width as CSS variable
  const gridStyle = {
    '--photo-width': `${photoWidth}px`,
  } as React.CSSProperties

  return (
    <div className="min-h-screen">
      <FilterBar
        sort={sort}
        onSortChange={setSort}
        showFilter={showFilter}
        onShowFilterChange={setShowFilter}
        photoWidth={photoWidth}
        onPhotoWidthChange={setPhotoWidth}
      />

      <div className="px-4 py-6">
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
            onLoadMore={loadMore}
            hasMore={hasMore}
            loadingMore={loadingMore}
            style={gridStyle}
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
