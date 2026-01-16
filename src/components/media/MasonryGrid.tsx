import { useEffect, useRef } from 'react'

interface Photo {
  id: string
  imageUrl: string
  type?: string
}

interface MasonryGridProps {
  photos: Photo[]
  onPhotoClick: (photoId: string) => void
  onLoadMore?: () => void
  hasMore?: boolean
  loadingMore?: boolean
  style?: React.CSSProperties
}

export function MasonryGrid({
  photos,
  onPhotoClick,
  onLoadMore,
  hasMore = false,
  loadingMore = false,
  style,
}: MasonryGridProps): React.ReactElement {
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!onLoadMore || !hasMore) return

    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        // When sentinel comes into view, load more
        if (entries[0].isIntersecting && !loadingMore) {
          onLoadMore()
        }
      },
      {
        // Trigger when sentinel is 200px from viewport
        rootMargin: '200px',
        threshold: 0,
      }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [onLoadMore, hasMore, loadingMore])

  return (
    <div className="masonry-grid" style={style}>
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="masonry-item"
        >
          <button
            onClick={() => onPhotoClick(photo.id)}
            className="photo-card w-full text-left"
          >
            <img
              src={photo.imageUrl}
              alt={`Photo ${photo.id}`}
              className="w-full h-auto"
              loading="lazy"
            />
            <div className="overlay" />
            <span className="photo-number">
              #{photo.id}
              {photo.type === 'document' && ' (Doc)'}
            </span>
          </button>
        </div>
      ))}

      {/* Sentinel element for triggering infinite scroll */}
      {hasMore && (
        <div
          ref={sentinelRef}
          className="masonry-item flex items-center justify-center py-8"
          style={{ minHeight: '100px' }}
        >
          {loadingMore && (
            <div className="text-muted-foreground text-sm">Loading more...</div>
          )}
        </div>
      )}
    </div>
  )
}
