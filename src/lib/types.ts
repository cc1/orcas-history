/**
 * Shared type definitions for the Orcas History application
 */

// ============================================================================
// Entity Types
// ============================================================================

export type EntityType = 'person' | 'place' | 'topic'

export interface Entity {
  type: EntityType
  slug: string
  name: string
}

export interface RelatedPage {
  type: EntityType
  slug: string
  name: string
}

// ============================================================================
// Media Types
// ============================================================================

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

export interface MediaLinks {
  people: Array<{ id: string; slug: string; name: string }>
  place: { id: string; slug: string; name: string } | null
}

export interface LinkedPhoto {
  id: string
  number: string
  imageUrl: string | null
  description?: string | null
}

// ============================================================================
// Person Types
// ============================================================================

export interface FamilyData {
  parents?: string[]
  spouses?: string[]
  children?: string[]
  siblings?: string[]
}

export interface TimelineEntry {
  year: number
  age?: number
  event: string
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
  familyData?: FamilyData | null
  timeline?: TimelineEntry[] | null
  relatedPages?: RelatedPage[] | null
  imageUrl: string | null
  sourcePageUrl?: string | null
  linkedPhotos?: LinkedPhoto[] | null
}

// ============================================================================
// Place Types
// ============================================================================

export interface ContentSection {
  heading: string
  content: string
}

export interface Place {
  id: string
  slug: string
  name: string
  description: string | null
  latitude: string | null
  longitude: string | null
  contentSections?: ContentSection[] | null
  researchQuestions?: string[] | null
  relatedPages?: RelatedPage[] | null
  imageUrl: string | null
  sourcePageUrl?: string | null
  linkedPhotos?: LinkedPhoto[] | null
}

// ============================================================================
// Topic Types
// ============================================================================

export interface Topic {
  id: string
  slug: string
  name: string
  description: string | null
  contentSections?: ContentSection[] | null
  researchQuestions?: string[] | null
  relatedPages?: RelatedPage[] | null
  imageUrl: string | null
  sourcePageUrl?: string | null
  linkedPhotos?: LinkedPhoto[] | null
}

// ============================================================================
// News Types
// ============================================================================

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

export interface EntityNewsItem {
  id: string
  itemId: string
  year: number
  month: string | null
  monthSort: number | null
  content: string
}

// ============================================================================
// Linked Mentions Types
// ============================================================================

export interface LinkedMentions {
  people: Array<{ slug: string; name: string }>
  places: Array<{ slug: string; name: string }>
  topics: Array<{ slug: string; name: string }>
}

// ============================================================================
// API Response Types
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  limit: number
  offset: number
}

export interface SingleResponse<T> {
  data: T
}
