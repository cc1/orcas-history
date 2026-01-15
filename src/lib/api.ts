/**
 * API client for fetching data from the backend
 */

const API_BASE = '/api'

// Type definitions matching the API responses
export interface MediaItem {
  id: string
  number: string
  category: 'photo' | 'document' | 'object'
  title: string | null
  description: string | null
  googleUrl: string | null
  webImagePath: string | null
  originalImagePath?: string | null
  resolutionStatus?: string
  dateSort: number | null
  needsDate: boolean | null
  locationText: string | null
  sourceText: string | null
  sourcePageUrl?: string | null
  externalUrl?: string | null
  hasHighRes: boolean | null
  isDuplicate?: boolean
  notes: string | null
  dateOriginalText: string | null
  datePrecision: string | null
  dateYearStart?: number | null
  dateYearEnd?: number | null
  dateMonth?: number | null
  dateDay?: number | null
}

export interface Person {
  id: string
  slug: string
  displayName: string
  biography?: string | null
  connectionToPtLawrence?: string | null
  miscellaneous?: string | null
  keyDatesText: string | null
  birthYear: number | null
  deathYear: number | null
  familyData?: {
    parents?: string[]
    spouses?: string[]
    children?: string[]
    siblings?: string[]
  } | null
  timeline?: Array<{
    year: number
    age?: number
    event: string
  }> | null
  imageUrl: string | null
  sourcePageUrl?: string | null
  linkedPhotos?: Array<{
    id: string
    number: string
    imageUrl: string
    description?: string | null
  }> | null
}

export interface Place {
  id: string
  slug: string
  name: string
  description: string | null
  latitude: string | null
  longitude: string | null
  contentSections?: Array<{
    heading: string
    content: string
  }> | null
  researchQuestions?: string[] | null
  imageUrl: string | null
  sourcePageUrl?: string | null
  linkedPhotos?: Array<{
    id: string
    number: string
    imageUrl: string | null
    description?: string | null
  }> | null
}

export interface Topic {
  id: string
  slug: string
  name: string
  description: string | null
  contentSections?: Array<{
    heading: string
    content: string
  }> | null
  researchQuestions?: string[] | null
  imageUrl: string | null
  sourcePageUrl?: string | null
  linkedPhotos?: Array<{
    id: string
    number: string
    imageUrl: string | null
    description?: string | null
  }> | null
}

export interface NewsItem {
  id: string
  itemId: string
  decade: string
  year: number
  month: string | null
  monthSort: number | null
  content: string
  sourceUrl: string | null
}

interface PaginatedResponse<T> {
  data: T[]
  total: number
  limit: number
  offset: number
}

interface SingleResponse<T> {
  data: T
}

// Fetch helpers
async function fetchApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`)
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }
  return response.json()
}

// Media API
export async function getMedia(params?: {
  category?: 'photo' | 'document'
  sort?: 'number' | 'year-asc' | 'year-desc' | 'random'
  needsDate?: boolean
  limit?: number
  offset?: number
}): Promise<PaginatedResponse<MediaItem>> {
  const searchParams = new URLSearchParams()
  if (params?.category) searchParams.set('category', params.category)
  if (params?.sort) searchParams.set('sort', params.sort)
  if (params?.needsDate) searchParams.set('needsDate', 'true')
  if (params?.limit) searchParams.set('limit', params.limit.toString())
  if (params?.offset) searchParams.set('offset', params.offset.toString())

  const query = searchParams.toString()
  return fetchApi(`/media${query ? `?${query}` : ''}`)
}

export async function getMediaByNumber(number: string): Promise<SingleResponse<MediaItem>> {
  return fetchApi(`/media/${number}`)
}

// People API
export async function getPeople(): Promise<SingleResponse<Person[]>> {
  return fetchApi('/people')
}

export async function getPersonBySlug(slug: string): Promise<SingleResponse<Person>> {
  return fetchApi(`/people/${slug}`)
}

// Places API
export async function getPlaces(): Promise<SingleResponse<Place[]>> {
  return fetchApi('/places')
}

export async function getPlaceBySlug(slug: string): Promise<SingleResponse<Place>> {
  return fetchApi(`/places/${slug}`)
}

// Topics API
export async function getTopics(): Promise<SingleResponse<Topic[]>> {
  return fetchApi('/topics')
}

export async function getTopicBySlug(slug: string): Promise<SingleResponse<Topic>> {
  return fetchApi(`/topics/${slug}`)
}

// News API
export async function getNews(params?: {
  sort?: 'asc' | 'desc'
  decade?: string
}): Promise<SingleResponse<NewsItem[]>> {
  const searchParams = new URLSearchParams()
  if (params?.sort) searchParams.set('sort', params.sort)
  if (params?.decade) searchParams.set('decade', params.decade)

  const query = searchParams.toString()
  return fetchApi(`/news${query ? `?${query}` : ''}`)
}

// Related Pages API (bidirectional text-based links)
export interface RelatedPages {
  people: Array<{
    slug: string
    name: string
  }>
  places: Array<{
    slug: string
    name: string
  }>
  topics: Array<{
    slug: string
    name: string
  }>
}

export async function getRelatedPages(
  entityType: 'person' | 'place' | 'topic',
  entityId: string
): Promise<SingleResponse<RelatedPages>> {
  return fetchApi(`/backlinks?type=${entityType}&id=${entityId}`)
}

// Media Links API
export interface MediaLinks {
  people: Array<{ id: string; slug: string; name: string }>
  place: { id: string; slug: string; name: string } | null
}

export async function updateMediaLinks(
  number: string,
  links: {
    people?: Array<{ id: string; slug: string; name: string }>
    place?: { id: string; slug: string; name: string } | null
  }
): Promise<SingleResponse<MediaLinks>> {
  const response = await fetch(`${API_BASE}/media/${number}/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(links),
  })
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }
  return response.json()
}
