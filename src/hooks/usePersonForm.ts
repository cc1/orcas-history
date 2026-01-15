/**
 * Hook for Person page form handling
 *
 * Encapsulates all save handlers for person fields including
 * text fields, family links, related pages, and timeline.
 */
import { useCallback } from 'react'
import { updatePersonField } from '@/lib/api'
import { markdownToTimeline } from '@/lib/timeline'
import type { RelatedPage } from '@/lib/types'

interface PersonLink {
  id: string
  slug: string
  name: string
}

interface FamilyData {
  parents?: string[]
  spouses?: string[]
  children?: string[]
  siblings?: string[]
}

type RelationshipType = 'parents' | 'spouses' | 'children' | 'siblings'

interface UsePersonFormOptions {
  slug: string | undefined
  familyData: FamilyData
}

interface UsePersonFormReturn {
  saveField: (field: string, value: string) => Promise<void>
  saveFamilyLinks: (type: RelationshipType, links: PersonLink[]) => Promise<void>
  saveRelatedPages: (pages: RelatedPage[]) => Promise<void>
  saveTimeline: (markdown: string) => Promise<void>
}

export function usePersonForm({
  slug,
  familyData,
}: UsePersonFormOptions): UsePersonFormReturn {
  const saveField = useCallback(async (field: string, value: string) => {
    if (!slug) return
    try {
      await updatePersonField(slug, field, value)
    } catch (error) {
      console.error(`Failed to save ${field}:`, error)
      throw error
    }
  }, [slug])

  const saveFamilyLinks = useCallback(async (
    relationshipType: RelationshipType,
    links: PersonLink[]
  ) => {
    if (!slug) return
    const updatedFamily = {
      ...familyData,
      [relationshipType]: links.map(l => l.name)
    }
    try {
      await updatePersonField(slug, 'familyData', updatedFamily)
    } catch (error) {
      console.error(`Failed to save family ${relationshipType}:`, error)
      throw error
    }
  }, [slug, familyData])

  const saveRelatedPages = useCallback(async (pages: RelatedPage[]) => {
    if (!slug) return
    try {
      await updatePersonField(slug, 'relatedPages', pages)
    } catch (error) {
      console.error('Failed to save related pages:', error)
      throw error
    }
  }, [slug])

  const saveTimeline = useCallback(async (markdown: string) => {
    if (!slug) return
    const parsedTimeline = markdownToTimeline(markdown)
    try {
      await updatePersonField(slug, 'timeline', parsedTimeline)
    } catch (error) {
      console.error('Failed to save timeline:', error)
      throw error
    }
  }, [slug])

  return {
    saveField,
    saveFamilyLinks,
    saveRelatedPages,
    saveTimeline,
  }
}
