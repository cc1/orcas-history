import { useNavigate } from 'react-router-dom'
import { EditableField } from '@/components/forms/EditableField'
import { AutocompleteField } from '@/components/forms/AutocompleteField'
import { useModalKeyboard } from '@/hooks/useModalKeyboard'
import { useMediaLinks } from '@/hooks/useMediaLinks'

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Sub-components
// ============================================================================

function NavigationButton({
  direction,
  onClick,
  rightOffset = '2',
}: {
  direction: 'prev' | 'next'
  onClick: () => void
  rightOffset?: string
}): React.ReactElement {
  const isPrev = direction === 'prev'
  return (
    <button
      onClick={onClick}
      className={`absolute ${isPrev ? 'left-2' : `right-${rightOffset} md:right-[320px]`} top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors`}
      aria-label={isPrev ? 'Previous photo' : 'Next photo'}
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={isPrev ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'}
        />
      </svg>
    </button>
  )
}

function IconButton({
  href,
  onClick,
  icon,
  label,
  position,
}: {
  href?: string
  onClick?: (e: React.MouseEvent) => void
  icon: React.ReactNode
  label: string
  position: 'topLeft' | 'topRight'
}): React.ReactElement {
  const positionClass = position === 'topLeft' ? 'top-4 left-4' : 'top-4 right-4'
  const className = `absolute ${positionClass} z-10 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors`

  if (href) {
    return (
      <a
        href={href}
        download
        className={className}
        aria-label={label}
        title={label}
        onClick={onClick}
      >
        {icon}
      </a>
    )
  }

  return (
    <button onClick={onClick} className={className} aria-label={label}>
      {icon}
    </button>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function PhotoModal({
  photo,
  onClose,
  onNavigate,
  onOpenPage,
}: PhotoModalProps): React.ReactElement {
  const navigate = useNavigate()

  // Keyboard navigation
  useModalKeyboard({
    onClose,
    onPrev: () => onNavigate('prev'),
    onNext: () => onNavigate('next'),
  })

  // Entity links management
  const { peopleLinks, locationLink, savePeopleLinks, saveLocationLink } = useMediaLinks({
    mediaNumber: photo.id,
    initialPeople: photo.peopleLinks,
    initialPlace: photo.locationLink,
  })

  const handleOpenPage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onOpenPage) {
      onOpenPage()
    } else {
      onClose()
      navigate(`/photos/${photo.id}`)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="fixed inset-4 md:inset-8 bg-card rounded-lg shadow-2xl flex flex-col md:flex-row overflow-hidden z-50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Navigation */}
        <NavigationButton direction="prev" onClick={() => onNavigate('prev')} />
        <NavigationButton direction="next" onClick={() => onNavigate('next')} />

        {/* Download Button */}
        <IconButton
          href={photo.imageUrl}
          onClick={(e) => e.stopPropagation()}
          position="topLeft"
          label="Download"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          }
        />

        {/* Close Button */}
        <IconButton
          onClick={onClose}
          position="topRight"
          label="Close"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          }
        />

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
              onClick={handleOpenPage}
              className="text-sm font-semibold text-primary hover:underline cursor-pointer"
            >
              Open Page →
            </a>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">Date</label>
              <EditableField
                value={photo.date || ''}
                onSave={async (value) => console.log('Saving date:', value)}
                placeholder="Enter date..."
                alwaysEditable
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">Location</label>
              <AutocompleteField
                type="place"
                value={locationLink}
                onSave={saveLocationLink}
                placeholder="Select location..."
                alwaysEditable
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">People</label>
              <AutocompleteField
                type="people"
                value={peopleLinks}
                onSave={savePeopleLinks}
                placeholder="Add people..."
                alwaysEditable
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">Description</label>
              <EditableField
                value={photo.description || ''}
                onSave={async (value) => console.log('Saving description:', value)}
                placeholder="Enter description..."
                multiline
                alwaysEditable
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">Source</label>
              <p className="text-muted-foreground">{photo.source || '—'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
