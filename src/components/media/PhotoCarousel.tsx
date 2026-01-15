import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface Photo {
  id: string
  number: string
  imageUrl: string | null
  description?: string | null
}

interface PhotoCarouselProps {
  photos: Photo[]
  title?: string
}

export function PhotoCarousel({ photos, title = 'Photos' }: PhotoCarouselProps): React.ReactElement | null {
  const navigate = useNavigate()
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!photos || photos.length === 0) return null

  const currentPhoto = photos[currentIndex]

  const goToPrev = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : photos.length - 1))
  }

  const goToNext = () => {
    setCurrentIndex(prev => (prev < photos.length - 1 ? prev + 1 : 0))
  }

  const handlePhotoClick = () => {
    navigate(`/photos/${currentPhoto.number}`)
  }

  return (
    <div className="mb-8">
      <h2 className="font-serif text-lg font-semibold text-foreground mb-3">
        {title} ({photos.length})
      </h2>

      {/* Black container for the entire carousel area */}
      <div className="relative bg-black rounded-lg overflow-hidden">
        {/* Photo display - centered */}
        <div
          className="aspect-[4/3] flex items-center justify-center cursor-pointer group"
          onClick={handlePhotoClick}
        >
          <img
            src={currentPhoto.imageUrl || ''}
            alt={currentPhoto.description || `Photo ${currentPhoto.number}`}
            className="max-w-full max-h-full object-contain group-hover:opacity-90 transition-opacity"
          />
        </div>

        {/* Info overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
          <span className="text-white font-medium">#{currentPhoto.number}</span>
          {currentPhoto.description && (
            <p className="text-white/80 text-sm mt-1 line-clamp-2">{currentPhoto.description}</p>
          )}
        </div>

        {/* Navigation arrows */}
        {photos.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); goToPrev(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors"
              aria-label="Previous photo"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors"
              aria-label="Next photo"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Photo counter */}
        {photos.length > 1 && (
          <div className="absolute top-3 right-3 bg-black/50 text-white text-sm px-2 py-1 rounded">
            {currentIndex + 1} / {photos.length}
          </div>
        )}
      </div>
    </div>
  )
}
