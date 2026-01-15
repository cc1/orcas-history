interface Photo {
  id: string
  imageUrl: string
  type?: string
}

interface MasonryGridProps {
  photos: Photo[]
  onPhotoClick: (photoId: string) => void
}

export function MasonryGrid({ photos, onPhotoClick }: MasonryGridProps): React.ReactElement {
  return (
    <div className="masonry-grid">
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
    </div>
  )
}
