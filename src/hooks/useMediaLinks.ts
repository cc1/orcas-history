/**
 * Hook for managing media entity links (people and places)
 *
 * Shared between PhotoModal and PhotoPage for consistent link handling.
 */
import { useState, useCallback } from 'react'
import { updateMediaLinks } from '@/lib/api'

interface EntityLink {
  id: string
  slug: string
  name: string
}

interface UseMediaLinksOptions {
  mediaNumber: string
  initialPeople?: EntityLink[]
  initialPlace?: EntityLink | null
}

interface UseMediaLinksReturn {
  peopleLinks: EntityLink[]
  locationLink: EntityLink | null
  savePeopleLinks: (links: EntityLink[] | EntityLink | null) => Promise<void>
  saveLocationLink: (link: EntityLink[] | EntityLink | null) => Promise<void>
}

export function useMediaLinks({
  mediaNumber,
  initialPeople = [],
  initialPlace = null,
}: UseMediaLinksOptions): UseMediaLinksReturn {
  const [peopleLinks, setPeopleLinks] = useState<EntityLink[]>(initialPeople)
  const [locationLink, setLocationLink] = useState<EntityLink | null>(initialPlace)

  // Note: We intentionally don't sync with initial values after mount.
  // The initial values are used once when the component mounts via useState.
  // This avoids infinite loops from new array references being passed on every render.

  const savePeopleLinks = useCallback(async (links: EntityLink[] | EntityLink | null) => {
    const newLinks = Array.isArray(links) ? links : links ? [links] : []
    setPeopleLinks(newLinks)
    try {
      await updateMediaLinks(mediaNumber, { people: newLinks })
    } catch (error) {
      console.error('Failed to save people links:', error)
      throw error
    }
  }, [mediaNumber])

  const saveLocationLink = useCallback(async (link: EntityLink[] | EntityLink | null) => {
    const newLink = Array.isArray(link) ? link[0] || null : link
    setLocationLink(newLink)
    try {
      await updateMediaLinks(mediaNumber, { place: newLink })
    } catch (error) {
      console.error('Failed to save location link:', error)
      throw error
    }
  }, [mediaNumber])

  return {
    peopleLinks,
    locationLink,
    savePeopleLinks,
    saveLocationLink,
  }
}
