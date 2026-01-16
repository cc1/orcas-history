/**
 * API client for fetching data from the backend
 *
 * Uses a factory pattern to reduce repetitive fetch code.
 */
import type {
  MediaItem,
  MediaLinks,
  Person,
  Place,
  Topic,
  NewsItem,
  EntityNewsItem,
  Entity,
  EntityType,
  LinkedMentions,
  RelatedPage,
  PaginatedResponse,
  SingleResponse,
} from './types'

// Re-export types for convenience
export type {
  MediaItem,
  MediaLinks,
  Person,
  Place,
  Topic,
  NewsItem,
  EntityNewsItem,
  Entity,
  EntityType,
  LinkedMentions,
  RelatedPage,
  PaginatedResponse,
  SingleResponse,
}

const API_BASE = '/api'

// ============================================================================
// Core Fetch Utilities
// ============================================================================

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options)
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }
  return response.json()
}

function buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = `${API_BASE}${endpoint}`
  if (!params) return url

  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.set(key, String(value))
    }
  }

  const query = searchParams.toString()
  return query ? `${url}?${query}` : url
}

// ============================================================================
// Entity API Factory
// ============================================================================

const ENTITY_ENDPOINTS: Record<EntityType, string> = {
  person: 'people',
  place: 'places',
  topic: 'topics',
}

function createEntityApi<T>(entityType: EntityType) {
  const endpoint = ENTITY_ENDPOINTS[entityType]

  return {
    getAll: (): Promise<SingleResponse<T[]>> =>
      fetchJson(buildUrl(`/${endpoint}`)),

    getBySlug: (slug: string): Promise<SingleResponse<T>> =>
      fetchJson(buildUrl(`/${endpoint}/${slug}`)),

    updateField: (
      slug: string,
      field: string,
      value: string | object
    ): Promise<{ success: boolean; field: string; value: unknown }> => {
      // Person endpoint has /update suffix for historical reasons
      const suffix = entityType === 'person' ? '/update' : ''
      return fetchJson(buildUrl(`/${endpoint}/${slug}${suffix}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value }),
      })
    },
  }
}

// Create typed entity APIs
const peopleApi = createEntityApi<Person>('person')
const placesApi = createEntityApi<Place>('place')
const topicsApi = createEntityApi<Topic>('topic')

// ============================================================================
// Exported API Functions
// ============================================================================

// Media API
export async function getMedia(params?: {
  category?: 'photo' | 'document'
  sort?: 'number' | 'year-asc' | 'year-desc' | 'random'
  needsDate?: boolean
  missingInfo?: boolean
  limit?: number
  offset?: number
}): Promise<PaginatedResponse<MediaItem>> {
  return fetchJson(buildUrl('/media', params))
}

export async function getMediaByNumber(number: string): Promise<SingleResponse<MediaItem>> {
  return fetchJson(buildUrl(`/media/${number}`))
}

export async function updateMediaField(
  number: string,
  field: string,
  value: string
): Promise<{ success: boolean; field: string; value: string }> {
  return fetchJson(buildUrl(`/media/${number}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ field, value }),
  })
}

export async function updateMediaLinks(
  number: string,
  links: {
    people?: Array<{ id: string; slug: string; name: string }>
    place?: { id: string; slug: string; name: string } | null
  }
): Promise<SingleResponse<MediaLinks>> {
  return fetchJson(buildUrl(`/media/${number}`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(links),
  })
}

// People API
export const getPeople = peopleApi.getAll
export const getPersonBySlug = peopleApi.getBySlug
export const updatePersonField = peopleApi.updateField

// Places API
export const getPlaces = placesApi.getAll
export const getPlaceBySlug = placesApi.getBySlug
export const updatePlaceField = placesApi.updateField

// Topics API
export const getTopics = topicsApi.getAll
export const getTopicBySlug = topicsApi.getBySlug
export const updateTopicField = topicsApi.updateField

// Generic entity field update
export function updateEntityField(
  entityType: EntityType,
  slug: string,
  field: string,
  value: string | object
): Promise<{ success: boolean; field: string; value: unknown }> {
  const apis = { person: peopleApi, place: placesApi, topic: topicsApi }
  return apis[entityType].updateField(slug, field, value)
}

// News API
export async function getNews(params?: {
  sort?: 'asc' | 'desc'
  decade?: string
}): Promise<SingleResponse<NewsItem[]>> {
  return fetchJson(buildUrl('/news', params))
}

export async function getEntityNews(
  entityType: EntityType,
  slug: string
): Promise<SingleResponse<EntityNewsItem[]>> {
  return fetchJson(buildUrl('/news', { entityType, entitySlug: slug }))
}

// Entity-related APIs
export async function getAllEntities(): Promise<SingleResponse<Entity[]>> {
  return fetchJson(buildUrl('/backlinks', { action: 'entities' }))
}

export async function getLinkedMentions(
  entityType: EntityType,
  entityId: string
): Promise<SingleResponse<LinkedMentions>> {
  return fetchJson(buildUrl('/backlinks', { type: entityType, id: entityId }))
}
