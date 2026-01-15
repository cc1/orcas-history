import { useEffect, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EditableField } from '@/components/forms/EditableField'
import { AutocompleteField } from '@/components/forms/AutocompleteField'
import { EditableSection } from '@/components/forms/EditableSection'
import { updateMediaLinks } from '@/lib/api'

interface EntityLink {
  id: string
  slug: string
  name: string
}

interface Photo {
  id: string
  imageUrl: string
  date: string
  location: string
  locationSlug?: string
  locationLink?: EntityLink | null
  people: string
  peopleLinks?: EntityLink[]
  description: string
  source: string
  type?: string
}

interface PhotoModalProps {
  photo: Photo
  onClose: () => void
  onNavigate: (direction: 'prev' | 'next') => void
  onOpenPage?: () => void
}

export function PhotoModal({ photo, onClose, onNavigate, onOpenPage }: PhotoModalProps): React.ReactElement {
  const navigate = useNavigate()

  // State for linked entities
  const [peopleLinks, setPeopleLinks] = useState<EntityLink[]>(photo.peopleLinks || [])
  const [locationLink, setLocationLink] = useState<EntityLink | null>(photo.locationLink || null)

  // Helper to navigate and close modal
  const handleLinkClick = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onClose()
    navigate(path)
  }

  // Generate slug from location text
  const locationSlug = photo.locationSlug || photo.location?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

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

  // Update state when photo changes
  useEffect(() => {
    setPeopleLinks(photo.peopleLinks || [])
    setLocationLink(photo.locationLink || null)
  }, [photo.id, photo.peopleLinks, photo.locationLink])

  const handleSave = async (field: string, value: string) => {
    // TODO: Implement API call to save text fields (date, description)
    console.log('Saving:', field, value)
  }

  const handleSavePeopleLinks = async (links: EntityLink[] | EntityLink | null) => {
    const newLinks = Array.isArray(links) ? links : links ? [links] : []
    setPeopleLinks(newLinks)
    try {
      await updateMediaLinks(photo.id, { people: newLinks })
    } catch (error) {
      console.error('Failed to save people links:', error)
    }
  }

  const handleSaveLocationLink = async (link: EntityLink[] | EntityLink | null) => {
    const newLink = Array.isArray(link) ? link[0] || null : link
    setLocationLink(newLink)
    try {
      await updateMediaLinks(photo.id, { place: newLink })
    } catch (error) {
      console.error('Failed to save location link:', error)
    }
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
        <div className="w-full md:w-80 bg-card border-t md:border-t-0 md:border-l overflow-y-auto p-6 pt-14">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-bold">
              {photo.type === 'document' ? 'Document' : 'Photo'} #{photo.id}
            </h2>
            <a
              href={`/photos/${photo.id}`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (onOpenPage) {
                  onOpenPage()
                } else {
                  onClose()
                  navigate(`/photos/${photo.id}`)
                }
              }}
              className="text-sm font-semibold text-primary hover:underline cursor-pointer"
            >
              Open Page →
            </a>
          </div>

          <EditableSection className="space-y-4 pr-8">
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">Date</label>
              <EditableField
                value={photo.date || ''}
                onSave={(value) => handleSave('date', value)}
                placeholder="Enter date..."
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">Location</label>
              <AutocompleteField
                type="place"
                value={locationLink}
                onSave={handleSaveLocationLink}
                placeholder="Select location..."
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">People</label>
              <AutocompleteField
                type="people"
                value={peopleLinks}
                onSave={handleSavePeopleLinks}
                placeholder="Add people..."
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">Description</label>
              <EditableField
                value={photo.description || ''}
                onSave={(value) => handleSave('description', value)}
                placeholder="Enter description..."
                multiline
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">Source</label>
              <p className="text-muted-foreground">{photo.source || '—'}</p>
            </div>
          </EditableSection>
        </div>
      </div>
    </div>
  )
}
