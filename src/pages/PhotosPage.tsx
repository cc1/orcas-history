import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { MasonryGrid } from '@/components/media/MasonryGrid'
import { PhotoModal } from '@/components/media/PhotoModal'
import { FilterBar } from '@/components/media/FilterBar'

// Mock data for development - will be replaced with actual data fetching
const mockPhotos = Array.from({ length: 50 }, (_, i) => ({
  id: String(i + 1).padStart(4, '0'),
  imageUrl: `https://picsum.photos/seed/${i}/400/300`,
  date: i % 3 === 0 ? 'TBD' : `19${40 + (i % 50)}`,
  location: ['Point Lawrence Lodge', 'Alderbrook Farm', 'Doe Bay', 'Olga'][i % 4],
  people: ['Ken Culver', 'Carroll Culver', 'TBD'][i % 3],
  description: `Historic photo #${i + 1} from the Orcas Island collection.`,
  source: 'Ken Culver',
  type: i % 10 === 0 ? 'document' : 'photo',
}))

type SortOption = 'random' | 'year-asc' | 'year-desc'

interface Filters {
  people: string[]
  places: string[]
  showDocuments: boolean
  needsDate: boolean
}

export function PhotosPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  const [photos, setPhotos] = useState(mockPhotos)
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(id || null)
  const [sort, setSort] = useState<SortOption>('random')
  const [filters, setFilters] = useState<Filters>({
    people: [],
    places: [],
    showDocuments: false,
    needsDate: false,
  })

  // Update selected photo when URL changes
  useEffect(() => {
    setSelectedPhotoId(id || null)
  }, [id])

  // Apply sorting
  useEffect(() => {
    let sorted = [...mockPhotos]

    if (sort === 'year-asc') {
      sorted.sort((a, b) => {
        if (a.date === 'TBD') return 1
        if (b.date === 'TBD') return -1
        return parseInt(a.date) - parseInt(b.date)
      })
    } else if (sort === 'year-desc') {
      sorted.sort((a, b) => {
        if (a.date === 'TBD') return 1
        if (b.date === 'TBD') return -1
        return parseInt(b.date) - parseInt(a.date)
      })
    } else {
      // Shuffle for random
      sorted = sorted.sort(() => Math.random() - 0.5)
    }

    setPhotos(sorted)
  }, [sort])

  // Apply filters
  const filteredPhotos = photos.filter(photo => {
    if (filters.showDocuments && photo.type !== 'document') return false
    if (filters.needsDate && photo.date !== 'TBD') return false
    // Add more filter logic as needed
    return true
  })

  const selectedPhoto = selectedPhotoId
    ? filteredPhotos.find(p => p.id === selectedPhotoId)
    : null

  const handlePhotoClick = (photoId: string) => {
    setSelectedPhotoId(photoId)
    setSearchParams({ photo: photoId })
  }

  const handleCloseModal = () => {
    setSelectedPhotoId(null)
    setSearchParams({})
  }

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!selectedPhotoId) return
    const currentIndex = filteredPhotos.findIndex(p => p.id === selectedPhotoId)
    let newIndex: number

    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : filteredPhotos.length - 1
    } else {
      newIndex = currentIndex < filteredPhotos.length - 1 ? currentIndex + 1 : 0
    }

    const newPhoto = filteredPhotos[newIndex]
    setSelectedPhotoId(newPhoto.id)
    setSearchParams({ photo: newPhoto.id })
  }

  return (
    <div className="min-h-screen">
      <FilterBar
        sort={sort}
        onSortChange={setSort}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <div className="container px-4 py-6">
        <MasonryGrid
          photos={filteredPhotos}
          onPhotoClick={handlePhotoClick}
        />
      </div>

      {selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          onClose={handleCloseModal}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  )
}
