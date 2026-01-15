/**
 * Hook for managing media entity links (people and places)
 *
 * Shared between PhotoModal and PhotoPage for consistent link handling.
 */
import { useState, useEffect, useCallback } from 'react'
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

  // Sync with initial values when they change
  useEffect(() => {
    setPeopleLinks(initialPeople)
    setLocationLink(initialPlace)
  }, [initialPeople, initialPlace])

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
