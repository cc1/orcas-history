import { useParams, useNavigate, Link } from 'react-router-dom'
import { useMediaByNumber, usePeople, usePlaces } from '@/hooks/useData'
import { EditableField } from '@/components/forms/EditableField'
import { AutocompleteField } from '@/components/forms/AutocompleteField'
import { EditableSection } from '@/components/forms/EditableSection'
import { updateMediaLinks, updateMediaField } from '@/lib/api'
import { useState, useEffect } from 'react'

interface EntityLink {
  id: string
  slug: string
  name: string
}

export function PhotoPage(): React.ReactElement {
  const { number } = useParams<{ number: string }>()
  const navigate = useNavigate()
  const { data: photo, loading, error } = useMediaByNumber(number || null)

  // State for linked entities
  const [peopleLinks, setPeopleLinks] = useState<EntityLink[]>([])
  const [locationLink, setLocationLink] = useState<EntityLink | null>(null)

  // Update state when photo data loads
  useEffect(() => {
    if (photo) {
      // TODO: Load actual linked entities from API
      setPeopleLinks([])
      setLocationLink(null)
    }
  }, [photo])

  if (loading) {
    return (
      <div className="container px-4 py-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading photo...</div>
        </div>
      </div>
    )
  }

  if (error || !photo) {
    return (
      <div className="container px-4 py-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-destructive">
            {error ? `Error: ${error.message}` : 'Photo not found'}
          </div>
        </div>
      </div>
    )
  }

  const imageUrl = photo.webImagePath || photo.googleUrl || ''

  const handleSave = async (field: string, value: string) => {
    try {
      await updateMediaField(photo.number, field, value)
    } catch (error) {
      console.error(`Failed to save ${field}:`, error)
    }
  }

  const handleSavePeopleLinks = async (links: EntityLink[] | EntityLink | null) => {
    const newLinks = Array.isArray(links) ? links : links ? [links] : []
    setPeopleLinks(newLinks)
    try {
      await updateMediaLinks(photo.number, { people: newLinks })
    } catch (error) {
      console.error('Failed to save people links:', error)
    }
  }

  const handleSaveLocationLink = async (link: EntityLink[] | EntityLink | null) => {
    const newLink = Array.isArray(link) ? link[0] || null : link
    setLocationLink(newLink)
    try {
      await updateMediaLinks(photo.number, { place: newLink })
    } catch (error) {
      console.error('Failed to save location link:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Back navigation */}
      <div className="container px-4 py-4">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
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
                <a
                  href={imageUrl}
                  download={`photo-${photo.number}.jpg`}
                  className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Download photo"
                  title="Download"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
              </div>

              <EditableSection className="space-y-5 pr-8">
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">Date</label>
                  <EditableField
                    value={photo.dateOriginalText || ''}
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
                  {photo.locationText && !locationLink && (
                    <p className="text-xs text-muted-foreground mt-1">Original: {photo.locationText}</p>
                  )}
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
                  <EditableField
                    value={photo.sourceText || ''}
                    onSave={(value) => handleSave('source', value)}
                    placeholder="Enter source..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">Notes</label>
                  <EditableField
                    value={photo.notes || ''}
                    onSave={(value) => handleSave('notes', value)}
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
