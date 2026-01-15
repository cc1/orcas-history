import { useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { EditableField } from '@/components/forms/EditableField'

interface Photo {
  id: string
  imageUrl: string
  date: string
  location: string
  people: string
  description: string
  source: string
  type?: string
}

interface PhotoModalProps {
  photo: Photo
  onClose: () => void
  onNavigate: (direction: 'prev' | 'next') => void
}

export function PhotoModal({ photo, onClose, onNavigate }: PhotoModalProps): React.ReactElement {
  const { canEdit } = useAuth()

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowLeft') onNavigate('prev')
    if (e.key === 'ArrowRight') onNavigate('next')
  }, [onClose, onNavigate])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  const handleSave = async (field: string, value: string) => {
    // TODO: Implement API call to save changes
    console.log('Saving:', field, value)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="fixed inset-4 md:inset-8 bg-card rounded-lg shadow-2xl flex flex-col md:flex-row overflow-hidden z-50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Navigation Buttons */}
        <button
          onClick={() => onNavigate('prev')}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          aria-label="Previous photo"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => onNavigate('next')}
          className="absolute right-2 md:right-[320px] top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          aria-label="Next photo"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image Area */}
        <div className="flex-1 bg-black flex items-center justify-center p-4 min-h-[300px] md:min-h-0">
          <img
            src={photo.imageUrl}
            alt={`Photo ${photo.id}`}
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* Metadata Panel */}
        <div className="w-full md:w-80 bg-card border-t md:border-t-0 md:border-l overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold">
              {photo.type === 'document' ? 'Document' : 'Photo'} #{photo.id}
            </h2>
            <Link
              to={`/photos/${photo.id}`}
              className="text-sm text-primary hover:underline"
            >
              Open Page
            </Link>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Date</label>
              {canEdit ? (
                <EditableField
                  value={photo.date}
                  onSave={(value) => handleSave('date', value)}
                  placeholder="Enter date..."
                />
              ) : (
                <p className={photo.date === 'TBD' ? 'text-muted-foreground italic' : ''}>
                  {photo.date}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Location</label>
              {canEdit ? (
                <EditableField
                  value={photo.location}
                  onSave={(value) => handleSave('location', value)}
                  placeholder="Enter location..."
                />
              ) : (
                <p className="text-primary hover:underline cursor-pointer">{photo.location}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">People</label>
              {canEdit ? (
                <EditableField
                  value={photo.people}
                  onSave={(value) => handleSave('people', value)}
                  placeholder="Enter people..."
                />
              ) : (
                <p>{photo.people}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              {canEdit ? (
                <EditableField
                  value={photo.description}
                  onSave={(value) => handleSave('description', value)}
                  placeholder="Enter description..."
                  multiline
                />
              ) : (
                <p className="text-muted-foreground">{photo.description}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Source</label>
              <p className="text-muted-foreground">{photo.source}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
