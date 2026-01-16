import { useParams, useNavigate } from 'react-router-dom'
import { useMediaByNumber } from '@/hooks/useData'
import { useMediaLinks } from '@/hooks/useMediaLinks'
import { EditableField } from '@/components/forms/EditableField'
import { AutocompleteField } from '@/components/forms/AutocompleteField'
import { EditableSection } from '@/components/forms/EditableSection'
import { handlePageState } from '@/components/layout/PageStates'
import { updateMediaField } from '@/lib/api'
import { getImageUrl } from '@/lib/utils'
import { useCallback } from 'react'

// ============================================================================
// Sub-components
// ============================================================================

function BackButton({ onClick }: { onClick: () => void }): React.ReactElement {
  return (
    <button
      onClick={onClick}
      className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      Back
    </button>
  )
}

function DownloadButton({ href, number }: { href: string; number: string }): React.ReactElement {
  return (
    <a
      href={href}
      download={`photo-${number}.jpg`}
      className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      aria-label="Download photo"
      title="Download"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
    </a>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function PhotoPage(): React.ReactElement {
  const { number } = useParams<{ number: string }>()
  const navigate = useNavigate()
  const { data: photo, loading, error } = useMediaByNumber(number || null)

  // Entity links management
  const { peopleLinks, locationLink, savePeopleLinks, saveLocationLink } = useMediaLinks({
    mediaNumber: number || '',
    initialPeople: [],
    initialPlace: null,
  })

  const saveField = useCallback(async (field: string, value: string) => {
    if (!photo) return
    try {
      await updateMediaField(photo.number, field, value)
    } catch (err) {
      console.error(`Failed to save ${field}:`, err)
    }
  }, [photo])

  // Handle loading/error/not-found states
  const pageState = handlePageState({ loading, error, data: photo, entityType: 'photo' })
  if (pageState) return pageState

  const imageUrl = getImageUrl(photo.webImagePath, photo.googleUrl)

  return (
    <div className="min-h-screen bg-background">
      {/* Back navigation */}
      <div className="container px-4 py-4">
        <BackButton onClick={() => navigate(-1)} />
      </div>

      <div className="container px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Photo Area */}
          <div className="lg:col-span-2">
            <div className="bg-black rounded-lg overflow-hidden">
              <div className="aspect-[4/3] flex items-center justify-center">
                <img
                  src={imageUrl}
                  alt={photo.description || `Photo #${photo.number}`}
                  className="max-w-full max-h-full object-contain"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                />
              </div>
            </div>

            {/* Description below photo on larger screens */}
            <div className="mt-6 hidden lg:block">
              {photo.description && (
                <p className="text-muted-foreground leading-relaxed">{photo.description}</p>
              )}
            </div>
          </div>

          {/* Metadata Panel */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border p-6">
              <div className="flex items-center justify-between mb-6">
                <h1 className="font-serif text-2xl font-bold">
                  {photo.category === 'document' ? 'Document' : 'Photo'} #{photo.number}
                </h1>
                <DownloadButton href={imageUrl} number={photo.number} />
              </div>

              <EditableSection className="space-y-5 pr-8">
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">
                    Date
                  </label>
                  <EditableField
                    value={photo.dateOriginalText || ''}
                    onSave={(value) => saveField('date', value)}
                    placeholder="Enter date..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">
                    Location
                  </label>
                  <AutocompleteField
                    type="place"
                    value={locationLink}
                    onSave={saveLocationLink}
                    placeholder="Select location..."
                  />
                  {photo.locationText && !locationLink && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Original: {photo.locationText}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">
                    People
                  </label>
                  <AutocompleteField
                    type="people"
                    value={peopleLinks}
                    onSave={savePeopleLinks}
                    placeholder="Add people..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">
                    Description
                  </label>
                  <EditableField
                    value={photo.description || ''}
                    onSave={(value) => saveField('description', value)}
                    placeholder="Enter description..."
                    multiline
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">
                    Source
                  </label>
                  <EditableField
                    value={photo.sourceText || ''}
                    onSave={(value) => saveField('source', value)}
                    placeholder="Enter source..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">
                    Notes
                  </label>
                  <EditableField
                    value={photo.notes || ''}
                    onSave={(value) => saveField('notes', value)}
                    placeholder="Add notes..."
                    multiline
                  />
                </div>

                {photo.hasHighRes && (
                  <div className="pt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      High-res available
                    </span>
                  </div>
                )}
              </EditableSection>
            </div>

            {/* Description on mobile */}
            <div className="mt-6 lg:hidden">
              {photo.description && (
                <p className="text-muted-foreground leading-relaxed">{photo.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
